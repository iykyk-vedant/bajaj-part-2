import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const globalForPool = globalThis as unknown as { pool: Pool };

const pool = globalForPool.pool || new Pool({
    host: process.env.PG_HOST?.replace(/'/g, ''),
    port: parseInt(process.env.PG_PORT || '5432'),
    user: process.env.PG_USER?.replace(/'/g, ''),
    password: process.env.PG_PASSWORD?.replace(/'/g, ''),
    database: process.env.PG_DATABASE?.replace(/'/g, ''),
    ssl: process.env.DB_SSL_DISABLED === 'true' ? false : {
        rejectUnauthorized: false
    },
    connectionTimeoutMillis: 10000,
});

if (process.env.NODE_ENV !== 'production') globalForPool.pool = pool;

export default pool;

export async function initializeDatabase() {
    const client = await pool.connect();
    try {
        // We assume tables are already created based on the report
        console.log('Database connection established');
    } finally {
        client.release();
    }
}

export async function getAllDcNumbers() {
    const result = await pool.query('SELECT dc_number, part_codes FROM dc_numbers');
    return result.rows.map(row => ({
        dcNumber: row.dc_number,
        partCodes: typeof row.part_codes === 'string' ? JSON.parse(row.part_codes) : row.part_codes
    }));
}

export async function addDcNumber(dcNo: string, partCodes: string[]) {
    const result = await pool.query(
        `INSERT INTO dc_numbers (dc_number, part_codes, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (dc_number) DO UPDATE SET part_codes = $2, updated_at = NOW()
     RETURNING *`,
        [dcNo, JSON.stringify(partCodes)]
    );
    return result.rows[0];
}

export async function saveConsolidatedDataEntry(data: any) {
    const columns = Object.keys(data).join(', ');
    const values = Object.values(data);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

    const result = await pool.query(
        `INSERT INTO consolidated_data (${columns}, updated_at) VALUES (${placeholders}, NOW()) RETURNING *`,
        values
    );
    return result.rows[0];
}

export async function updateConsolidatedDataEntry(id: string, data: any) {
    const sets = Object.keys(data).map((key, i) => `${key} = $${i + 1}`).join(', ');
    const values = [...Object.values(data), id];

    const result = await pool.query(
        `UPDATE consolidated_data SET ${sets}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
        values
    );
    return result.rows[0];
}

export async function updateConsolidatedDataEntryByProductSrNo(productSrNo: string, data: any) {
    const sets = Object.keys(data).map((key, i) => `${key} = $${i + 1}`).join(', ');
    const values = [...Object.values(data), productSrNo];

    const result = await pool.query(
        `UPDATE consolidated_data SET ${sets}, updated_at = NOW() WHERE product_sr_no = $${values.length} RETURNING *`,
        values
    );
    return result.rows[0];
}

export async function deleteConsolidatedDataEntry(id: string) {
    const result = await pool.query('DELETE FROM consolidated_data WHERE id = $1', [id]);
    return result.rowCount ? result.rowCount > 0 : false;
}

export async function getConsolidatedDataEntries(pageNum?: number, pageSize?: number) {
    let query = 'SELECT * FROM consolidated_data ORDER BY id DESC';
    const values = [];

    if (pageNum && pageSize) {
        query += ' LIMIT $1 OFFSET $2';
        values.push(pageSize, (pageNum - 1) * pageSize);
    }

    const result = await pool.query(query, values);

    let totalRows = 0;
    if (pageNum && pageSize) {
        const countResult = await pool.query('SELECT COUNT(*) FROM consolidated_data');
        totalRows = parseInt(countResult.rows[0].count);
    }

    return {
        rows: result.rows,
        totalRows
    };
}

export async function getBomDescription(partCode: string, location: string) {
    const result = await pool.query(
        'SELECT description FROM bom WHERE part_code = $1 AND location = $2',
        [partCode, location]
    );
    return result.rows[0]?.description || null;
}

export async function checkIfLocationExists(location: string) {
    const result = await pool.query('SELECT 1 FROM bom WHERE location = $1 LIMIT 1', [location]);
    return (result.rowCount ?? 0) > 0;
}

export async function checkComponentForPartCode(partCode: string, location: string, parentPartCode: string) {
    // This logic depends on how the BOM is structured for parent-child relationship.
    // Assuming 'bom' table might have a relationship or we just check if it exists.
    const result = await pool.query(
        'SELECT 1 FROM bom WHERE part_code = $1 AND location = $2 LIMIT 1',
        [partCode, location]
    );
    return (result.rowCount ?? 0) > 0;
}

export async function getNextSrNoForPartcode(partCode: string) {
    const result = await pool.query(
        'SELECT MAX(CAST(sr_no AS INTEGER)) as max_sr FROM consolidated_data WHERE part_code = $1',
        [partCode]
    );
    const nextSr = (result.rows[0]?.max_sr || 0) + 1;
    return String(nextSr).padStart(3, '0');
}

export async function getAllEngineers() {
    const result = await pool.query('SELECT * FROM engineers ORDER BY name ASC');
    return result.rows;
}

export async function addEngineer(name: string) {
    const result = await pool.query(
        'INSERT INTO engineers (name, updated_at) VALUES ($1, NOW()) ON CONFLICT (name) DO UPDATE SET updated_at = NOW() RETURNING *',
        [name]
    );
    return result.rows[0];
}

export async function searchConsolidatedDataEntriesByPcb(query: string, partCode: string, pcbSrNo: string, mfgMonthYear?: string, srNo?: string) {
    // If we have all components for the PCB serial number, try exact match first using the composite index
    if (partCode && srNo && mfgMonthYear) {
        const result = await pool.query(
            'SELECT * FROM consolidated_data WHERE part_code = $1 AND sr_no = $2 AND mfg_month_year = $3',
            [partCode, srNo, mfgMonthYear]
        );
        if (result.rows.length > 0) {
            return result.rows;
        }
    }

    // Fallback to searching by PCB serial number (which is indexed)
    const result = await pool.query(
        'SELECT * FROM consolidated_data WHERE pcb_sr_no = $1 OR (part_code = $2 AND pcb_sr_no LIKE $3)',
        [pcbSrNo, partCode, `%${query}%`]
    );
    return result.rows;
}

export function convertToPostgresDate(dateStr: string) {
    if (!dateStr) return null;
    // Handle DD/MM/YYYY or YYYY-MM-DD
    if (dateStr.includes('/')) {
        const [day, month, year] = dateStr.split('/');
        return `${year}-${month}-${day}`;
    }
    return dateStr;
}

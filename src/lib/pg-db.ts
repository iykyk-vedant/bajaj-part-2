import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Create a PostgreSQL connection pool
const poolConfig: PoolConfig = {
  max: 10, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
};

// Use DATABASE_URL if provided (e.g., from Render PostgreSQL add-on)
if (process.env.DATABASE_URL) {
  Object.assign(poolConfig, {
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
} else {
  // Use individual connection parameters
  Object.assign(poolConfig, {
    host: process.env.PG_HOST?.replace(/'/g, '') || 'localhost',
    port: parseInt(process.env.PG_PORT || '5432'),
    user: process.env.PG_USER?.replace(/'/g, '') || 'postgres',
    password: process.env.PG_PASSWORD?.replace(/'/g, '') || '',
    database: process.env.PG_DATABASE?.replace(/'/g, '') || 'nexscan',
    ssl: {
      rejectUnauthorized: false
    }
  });
}

const pool = new Pool(poolConfig);

// Initialize the database tables
export async function initializeDatabase() {
  try {
    const databaseName = process.env.PG_DATABASE || 'nexscan';
    
    // Create sheets table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sheets (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create sheet_data table for storing the actual sheet data
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sheet_data (
        id SERIAL PRIMARY KEY,
        sheet_id VARCHAR(255) NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sheet_id) REFERENCES sheets(id) ON DELETE CASCADE
      )
    `);
    
    // Create BOM table for component validation
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bom (
        id SERIAL PRIMARY KEY,
        part_code VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (part_code, location)
      )
    `);
    
    // Create consumption_entries table with the required fields
    await pool.query(`
      CREATE TABLE IF NOT EXISTS consumption_entries (
        id VARCHAR(255) PRIMARY KEY,
        repair_date DATE,
        testing VARCHAR(50),
        failure VARCHAR(50),
        status VARCHAR(50),
        pcb_sr_no VARCHAR(255),
        rf_observation TEXT,
        analysis TEXT,
        validation_result TEXT,
        component_change TEXT,
        engg_name VARCHAR(255),
        dispatch_date DATE,
        component_consumption TEXT,
        consumption_entry VARCHAR(255),
        consumption_entry_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create dc_numbers table for storing DC numbers and their part codes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS dc_numbers (
        id SERIAL PRIMARY KEY,
        dc_number VARCHAR(255) NOT NULL UNIQUE,
        part_codes JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create consolidated_data table that matches the Excel export structure
    await pool.query(`
      CREATE TABLE IF NOT EXISTS consolidated_data (
        id SERIAL PRIMARY KEY,
        sr_no VARCHAR(255),
        dc_no VARCHAR(255),
        dc_date DATE,
        branch VARCHAR(255),
        bccd_name VARCHAR(255),
        product_description TEXT,
        product_sr_no VARCHAR(255),
        date_of_purchase DATE,
        complaint_no VARCHAR(255),
        part_code VARCHAR(255),
        defect TEXT,
        visiting_tech_name VARCHAR(255),
        mfg_month_year VARCHAR(255),
        repair_date DATE,
        testing VARCHAR(50),
        failure VARCHAR(50),
        status VARCHAR(50),
        pcb_sr_no VARCHAR(255),
        rf_observation TEXT,
        analysis TEXT,
        validation_result TEXT,
        component_change TEXT,
        engg_name VARCHAR(255),
        dispatch_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Export the pool for use in other files
export default pool;

// BOM service functions
export async function getBomDescription(partCode: string, location: string): Promise<string | null> {
  try {
    const result = await pool.query(
      'SELECT description FROM bom WHERE part_code = $1 AND location = $2',
      [partCode, location]
    );
    
    if (result.rows.length > 0) {
      return result.rows[0].description;
    }
    return null;
  } catch (error) {
    console.error('Error fetching BOM description:', error);
    return null;
  }
}

// Check if a location exists in the BOM
export async function checkIfLocationExists(location: string): Promise<boolean> {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM bom WHERE location = $1',
      [location]
    );
    
    return parseInt(result.rows[0].count) > 0;
  } catch (error) {
    console.error('Error checking if location exists:', error);
    return false;
  }
}

// Check if a component exists in the BOM for a specific part code
export async function checkComponentForPartCode(partCode: string, location: string, parentPartCode: string): Promise<boolean> {
  try {
    // This would check if the component is valid for the specific parent part code
    // For now, we'll just check if it exists in the BOM
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM bom WHERE part_code = $1 AND location = $2',
      [partCode, location]
    );
    
    return parseInt(result.rows[0].count) > 0;
  } catch (error) {
    console.error('Error checking component for part code:', error);
    return false;
  }
}

// DC Number service functions
export async function getAllDcNumbers(): Promise<{dcNumber: string, partCodes: string[]}[]> {
  try {
    const result = await pool.query(
      'SELECT dc_number, part_codes FROM dc_numbers ORDER BY created_at ASC'
    );
    
    return result.rows.map((row: any) => {
      let partCodes: string[] = [];
      if (row.part_codes) {
        if (Array.isArray(row.part_codes)) {
          // Already parsed as array
          partCodes = row.part_codes;
        } else if (typeof row.part_codes === 'object') {
          // Already parsed as object, convert to array
          partCodes = Object.values(row.part_codes);
        } else {
          // Treat as JSON string and parse
          try {
            partCodes = JSON.parse(row.part_codes);
          } catch (parseError) {
            // If JSON parsing fails, treat as comma-separated string
            partCodes = row.part_codes.split(',').map((code: string) => code.trim()).filter((code: string) => code.length > 0);
          }
        }
      }
      return {
        dcNumber: row.dc_number,
        partCodes
      };
    });
  } catch (error) {
    console.error('Error fetching DC numbers:', error);
    // Return default empty values instead of failing completely
    return [];
  }
}

export async function addDcNumber(dcNumber: string, partCodes: string[] = []): Promise<boolean> {
  try {
    // Check if DC number already exists
    const existingResult = await pool.query(
      'SELECT id FROM dc_numbers WHERE dc_number = $1',
      [dcNumber]
    );
    
    if (existingResult.rows.length > 0) {
      // Update existing record
      await pool.query(
        'UPDATE dc_numbers SET part_codes = $1, updated_at = CURRENT_TIMESTAMP WHERE dc_number = $2',
        [JSON.stringify(partCodes), dcNumber]
      );
    } else {
      // Insert new record
      await pool.query(
        'INSERT INTO dc_numbers (dc_number, part_codes) VALUES ($1, $2)',
        [dcNumber, JSON.stringify(partCodes)]
      );
    }
    
    return true;
  } catch (error) {
    console.error('Error adding DC number:', error);
    return false;
  }
}

export async function updateDcNumberPartCodes(dcNumber: string, partCodes: string[]): Promise<boolean> {
  try {
    await pool.query(
      'UPDATE dc_numbers SET part_codes = $1, updated_at = CURRENT_TIMESTAMP WHERE dc_number = $2',
      [JSON.stringify(partCodes), dcNumber]
    );
    return true;
  } catch (error) {
    console.error('Error updating DC number part codes:', error);
    return false;
  }
}

export async function deleteDcNumber(dcNumber: string): Promise<boolean> {
  try {
    await pool.query(
      'DELETE FROM dc_numbers WHERE dc_number = $1',
      [dcNumber]
    );
    return true;
  } catch (error) {
    console.error('Error deleting DC number:', error);
    return false;
  }
}

// Sheet service functions
export async function getAllSheets(): Promise<any[]> {
  try {
    const result = await pool.query(
      'SELECT * FROM sheets ORDER BY created_at DESC'
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching sheets:', error);
    return [];
  }
}

export async function createSheet(sheet: any): Promise<any> {
  try {
    const createdAt = new Date().toISOString();
    await pool.query(
      'INSERT INTO sheets (id, name, created_at, updated_at) VALUES ($1, $2, $3, $4)',
      [sheet.id, sheet.name, createdAt, createdAt]
    );
    return { ...sheet, createdAt, updatedAt: createdAt };
  } catch (error) {
    console.error('Error creating sheet:', error);
    throw error;
  }
}

export async function updateSheetName(sheetId: string, name: string): Promise<void> {
  try {
    const updatedAt = new Date().toISOString();
    await pool.query(
      'UPDATE sheets SET name = $1, updated_at = $2 WHERE id = $3',
      [name, updatedAt, sheetId]
    );
  } catch (error) {
    console.error('Error updating sheet name:', error);
    throw error;
  }
}

export async function deleteSheet(sheetId: string): Promise<void> {
  try {
    await pool.query(
      'DELETE FROM sheets WHERE id = $1',
      [sheetId]
    );
  } catch (error) {
    console.error('Error deleting sheet:', error);
    throw error;
  }
}

export async function addDataToSheet(sheetId: string, data: any): Promise<void> {
  try {
    const createdAt = new Date().toISOString();
    await pool.query(
      'INSERT INTO sheet_data (sheet_id, data, created_at) VALUES ($1, $2, $3)',
      [sheetId, JSON.stringify(data), createdAt]
    );
  } catch (error) {
    console.error('Error adding data to sheet:', error);
    throw error;
  }
}

export async function updateSheetData(sheetId: string, data: any[]): Promise<void> {
  try {
    // First clear existing data
    await pool.query(
      'DELETE FROM sheet_data WHERE sheet_id = $1',
      [sheetId]
    );
    
    // Then insert new data
    for (const item of data) {
      const createdAt = new Date().toISOString();
      await pool.query(
        'INSERT INTO sheet_data (sheet_id, data, created_at) VALUES ($1, $2, $3)',
        [sheetId, JSON.stringify(item), createdAt]
      );
    }
  } catch (error) {
    console.error('Error updating sheet data:', error);
    throw error;
  }
}

export async function clearSheetData(sheetId: string): Promise<void> {
  try {
    await pool.query(
      'DELETE FROM sheet_data WHERE sheet_id = $1',
      [sheetId]
    );
  } catch (error) {
    console.error('Error clearing sheet data:', error);
    throw error;
  }
}

// Add sample BOM data for testing
export async function addSampleBomData() {
  try {
    // Check if we already have data
    const countResult = await pool.query('SELECT COUNT(*) as count FROM bom');
    if (parseInt(countResult.rows[0].count) > 0) {
      return; // Already has data
    }
    
    // No sample data to add - keeping database empty as per requirements
    console.log('No sample BOM data added - database kept empty');
  } catch (error) {
    console.error('Error checking BOM data:', error);
  }
}

// Save consolidated data entry
export async function saveConsolidatedDataEntry(entry: any): Promise<boolean> {
  try {
    // Handle empty dates by converting them to NULL
    const dcDateValue = entry.dcDate && entry.dcDate.trim() !== '' ? convertToPostgresDate(entry.dcDate) : null;
    const dateOfPurchaseValue = entry.dateOfPurchase && entry.dateOfPurchase.trim() !== '' ? convertToPostgresDate(entry.dateOfPurchase) : null;
    const repairDateValue = entry.repairDate && entry.repairDate.trim() !== '' ? convertToPostgresDate(entry.repairDate) : null;
    const dispatchDateValue = entry.dispatchDate && entry.dispatchDate.trim() !== '' ? convertToPostgresDate(entry.dispatchDate) : null;
    
    await pool.query(`
      INSERT INTO consolidated_data 
      (sr_no, dc_no, dc_date, branch, bccd_name, product_description, product_sr_no, 
       date_of_purchase, complaint_no, part_code, defect, visiting_tech_name, mfg_month_year,
       repair_date, testing, failure, status, pcb_sr_no, rf_observation, analysis, 
       validation_result, component_change, engg_name, dispatch_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
    `, [
      entry.srNo,
      entry.dcNo,
      dcDateValue,
      entry.branch,
      entry.bccdName,
      entry.productDescription,
      entry.productSrNo,
      dateOfPurchaseValue,
      entry.complaintNo,
      entry.partCode,
      entry.defect,
      entry.visitingTechName,
      entry.mfgMonthYear,
      repairDateValue,
      entry.testing,
      entry.failure,
      entry.status,
      entry.pcbSrNo,
      entry.rfObservation,
      entry.analysis,
      entry.validationResult,
      entry.componentChange,
      entry.enggName,
      dispatchDateValue
    ]);
    
    return true;
  } catch (error) {
    console.error('Error saving consolidated data entry:', error);
    return false;
  }
}

// Get all consolidated data entries
export async function getAllConsolidatedDataEntries(): Promise<any[]> {
  try {
    const result = await pool.query('SELECT * FROM consolidated_data ORDER BY created_at DESC');
    return result.rows;
  } catch (error) {
    console.error('Error fetching consolidated data entries:', error);
    return [];
  }
}

// Update a specific consolidated data entry
export async function updateConsolidatedDataEntry(id: string, entry: any): Promise<boolean> {
  try {
    // Handle empty dates by converting them to NULL
    const dcDateValue = entry.dcDate && entry.dcDate.trim() !== '' ? convertToPostgresDate(entry.dcDate) : null;
    const dateOfPurchaseValue = entry.dateOfPurchase && entry.dateOfPurchase.trim() !== '' ? convertToPostgresDate(entry.dateOfPurchase) : null;
    const repairDateValue = entry.repairDate && entry.repairDate.trim() !== '' ? convertToPostgresDate(entry.repairDate) : null;
    const dispatchDateValue = entry.dispatchDate && entry.dispatchDate.trim() !== '' ? convertToPostgresDate(entry.dispatchDate) : null;
    
    await pool.query(
      `UPDATE consolidated_data SET
         sr_no = $1, dc_no = $2, dc_date = $3, branch = $4, bccd_name = $5,
         product_description = $6, product_sr_no = $7, date_of_purchase = $8,
         complaint_no = $9, part_code = $10, defect = $11, visiting_tech_name = $12,
         mfg_month_year = $13, repair_date = $14, testing = $15, failure = $16,
         status = $17, pcb_sr_no = $18, rf_observation = $19, analysis = $20,
         validation_result = $21, component_change = $22, engg_name = $23, dispatch_date = $24,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $25`,
      [
        entry.srNo,
        entry.dcNo,
        dcDateValue,
        entry.branch,
        entry.bccdName,
        entry.productDescription,
        entry.productSrNo,
        dateOfPurchaseValue,
        entry.complaintNo,
        entry.partCode,
        entry.defect,
        entry.visitingTechName,
        entry.mfgMonthYear,
        repairDateValue,
        entry.testing,
        entry.failure,
        entry.status,
        entry.pcbSrNo,
        entry.rfObservation,
        entry.analysis,
        entry.validationResult,
        entry.componentChange,
        entry.enggName,
        dispatchDateValue,
        id
      ]
    );
    
    return true;
  } catch (error) {
    console.error('Error updating consolidated data entry:', error);
    return false;
  }
}

// Delete a specific consolidated data entry
export async function deleteConsolidatedDataEntry(id: string): Promise<boolean> {
  try {
    await pool.query(
      'DELETE FROM consolidated_data WHERE id = $1',
      [id]
    );
    return true;
  } catch (error) {
    console.error('Error deleting consolidated data entry:', error);
    return false;
  }
}

// Helper function to convert date to PostgreSQL compatible format (YYYY-MM-DD)
export function convertToPostgresDate(dateStr: string | null): string | null {
  if (!dateStr || dateStr.trim() === '') {
    return null;
  }
  
  // If already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  // Try to parse DD/MM/YYYY or MM/DD/YYYY or DD-MM-YYYY format
  const parts = dateStr.split(/[\/-]/);
  if (parts.length === 3) {
    const [first, second, year] = parts;
    
    // If year is 2 digits, convert to 4 digits (assuming 20xx)
    let fullYear = year.length === 2 ? `20${year}` : year;
    
    // Check if first part looks like day (1-31) or month (1-12)
    const firstNum = parseInt(first, 10);
    const secondNum = parseInt(second, 10);
    
    // If first number is more than 12, assume it's DD/MM/YYYY or DD-MM-YYYY
    if (firstNum > 12) {
      // DD/MM/YYYY or DD-MM-YYYY format
      const day = first.padStart(2, '0');
      const month = second.padStart(2, '0');
      return `${fullYear}-${month}-${day}`;
    } else {
      // Assume MM/DD/YYYY or MM-DD-YYYY format
      const month = first.padStart(2, '0');
      const day = second.padStart(2, '0');
      return `${fullYear}-${month}-${day}`;
    }
  }
  
  // If we can't parse it, return as is and let PostgreSQL handle the error
  return dateStr;
}

// Clear all consolidated data entries
export async function clearConsolidatedData(): Promise<void> {
  try {
    await pool.query('DELETE FROM consolidated_data');
  } catch (error) {
    console.error('Error clearing consolidated data:', error);
    throw error;
  }
}
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
    ssl: process.env.DB_SSL_DISABLED === 'true' ? false : {
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
    ssl: process.env.DB_SSL_DISABLED === 'true' ? false : {
      rejectUnauthorized: false
    }
  });
}

const pool = new Pool(poolConfig);

// Initialize the database tables
export async function initializeDatabase() {
  try {
    const databaseName = process.env.PG_DATABASE || 'nexscan';

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
        product_sr_no VARCHAR(255) UNIQUE,
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
        analysis TEXT,
        component_change TEXT,
        engg_name VARCHAR(255),
        tag_entry_by VARCHAR(255),
        consumption_entry_by VARCHAR(255),
        dispatch_entry_by VARCHAR(255),
        dispatch_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create users table for Supabase user synchronization
    // Enable the pgcrypto extension for gen_random_uuid() if not already enabled
    await pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        supabase_user_id TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        role TEXT DEFAULT 'USER',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create engineers table for storing engineer names
    await pool.query(`
      CREATE TABLE IF NOT EXISTS engineers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for better query performance
    try {
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_engineer_name ON engineers (name);`);
    } catch (indexError) {
      // Index might already exist, which is fine
      console.log('Engineer index creation attempted - may already exist');
    }

    // Add name column if it doesn't exist (for existing databases)
    try {
      await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;`);
    } catch (alterError) {
      // Column may already exist, which is fine
      console.log('Name column addition attempted - may already exist');
    }

    // Create indexes for better query performance
    try {
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_supabase_user_id ON users (supabase_user_id);`);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_email ON users (email);`);
    } catch (indexError) {
      // Indexes might already exist, which is fine
      console.log('Indexes creation attempted - may already exist');
    }

    // Create sheets table for grouping data
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sheets (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
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

// Get the next sequential SR No for a given Partcode
export async function getNextSrNoForPartcode(partcode: string): Promise<string> {
  try {
    console.log('Getting next SR No for Partcode:', partcode);

    const result = await pool.query(
      'SELECT MAX(CAST(sr_no AS INTEGER)) as max_sr_no FROM consolidated_data WHERE part_code = $1',
      [partcode]
    );

    console.log('Database query result:', result.rows);
    const maxSrNo = result.rows[0]?.max_sr_no || 0;
    console.log('Max SR No found:', maxSrNo);

    const nextSrNo = maxSrNo + 1;
    console.log('Next SR No calculated:', nextSrNo);

    const formattedSrNo = String(nextSrNo).padStart(3, '0');
    console.log('Formatted SR No:', formattedSrNo);

    return formattedSrNo;
  } catch (error) {
    console.error('Error getting next SR No for Partcode:', error);
    return '001'; // Default fallback
  }
}

// Find consolidated data entry by part_code and sr_no
export async function findConsolidatedDataEntryByPartCodeAndSrNo(partCode: string, srNo: string): Promise<any> {
  try {
    const result = await pool.query(
      'SELECT * FROM consolidated_data WHERE part_code = $1 AND sr_no = $2 LIMIT 1',
      [partCode, srNo]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error('Error finding consolidated data entry by part_code and sr_no:', error);
    return null;
  }
}

// Find consolidated data entry by product_sr_no
export async function findConsolidatedDataEntryByProductSrNo(productSrNo: string): Promise<any> {
  try {
    const result = await pool.query(
      'SELECT * FROM consolidated_data WHERE product_sr_no = $1 LIMIT 1',
      [productSrNo]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error('Error finding consolidated data entry by product_sr_no:', error);
    return null;
  }
}

// Update consolidated data entry by product_sr_no
export async function updateConsolidatedDataEntryByProductSrNo(productSrNo: string, entry: any): Promise<boolean> {
  try {
    console.log('Updating consolidated data entry for product_sr_no:', productSrNo);
    console.log('Entry data being sent:', entry);

    // Build dynamic query based on provided fields
    const updates = [];
    const values = [];
    let paramCount = 1;

    // Handle tag entry fields (only update if provided)
    if (entry.srNo !== undefined && entry.srNo !== null) {
      updates.push(`sr_no = $${paramCount}`);
      values.push(entry.srNo);
      paramCount++;
    }
    if (entry.dcNo !== undefined && entry.dcNo !== null) {
      updates.push(`dc_no = $${paramCount}`);
      values.push(entry.dcNo);
      paramCount++;
    }
    if (entry.dcDate !== undefined && entry.dcDate !== null) {
      const dcDateValue = entry.dcDate && entry.dcDate.trim() !== '' ? convertToPostgresDate(entry.dcDate) : null;
      updates.push(`dc_date = $${paramCount}`);
      values.push(dcDateValue);
      paramCount++;
    }
    if (entry.branch !== undefined && entry.branch !== null) {
      updates.push(`branch = $${paramCount}`);
      values.push(entry.branch);
      paramCount++;
    }
    if (entry.bccdName !== undefined && entry.bccdName !== null) {
      updates.push(`bccd_name = $${paramCount}`);
      values.push(entry.bccdName);
      paramCount++;
    }
    if (entry.productDescription !== undefined && entry.productDescription !== null) {
      updates.push(`product_description = $${paramCount}`);
      values.push(entry.productDescription);
      paramCount++;
    }
    if (entry.productSrNo !== undefined && entry.productSrNo !== null) {
      updates.push(`product_sr_no = $${paramCount}`);
      values.push(entry.productSrNo);
      paramCount++;
    }
    if (entry.dateOfPurchase !== undefined && entry.dateOfPurchase !== null) {
      const dateOfPurchaseValue = entry.dateOfPurchase && entry.dateOfPurchase.trim() !== '' ? convertToPostgresDate(entry.dateOfPurchase) : null;
      updates.push(`date_of_purchase = $${paramCount}`);
      values.push(dateOfPurchaseValue);
      paramCount++;
    }
    if (entry.complaintNo !== undefined && entry.complaintNo !== null) {
      updates.push(`complaint_no = $${paramCount}`);
      values.push(entry.complaintNo);
      paramCount++;
    }
    if (entry.partCode !== undefined && entry.partCode !== null) {
      updates.push(`part_code = $${paramCount}`);
      values.push(entry.partCode);
      paramCount++;
    }
    if (entry.defect !== undefined && entry.defect !== null) {
      updates.push(`defect = $${paramCount}`);
      values.push(entry.defect);
      paramCount++;
    }
    if (entry.visitingTechName !== undefined && entry.visitingTechName !== null) {
      updates.push(`visiting_tech_name = $${paramCount}`);
      values.push(entry.visitingTechName);
      paramCount++;
    }
    if (entry.mfgMonthYear !== undefined && entry.mfgMonthYear !== null) {
      updates.push(`mfg_month_year = $${paramCount}`);
      values.push(entry.mfgMonthYear);
      paramCount++;
    }
    if (entry.pcbSrNo !== undefined && entry.pcbSrNo !== null) {
      updates.push(`pcb_sr_no = $${paramCount}`);
      values.push(entry.pcbSrNo);
      paramCount++;
    }

    // Handle consumption fields (only update if provided)
    if (entry.repairDate !== undefined && entry.repairDate !== null) {
      const repairDateValue = entry.repairDate && entry.repairDate.trim() !== '' ? convertToPostgresDate(entry.repairDate) : null;
      updates.push(`repair_date = $${paramCount}`);
      values.push(repairDateValue);
      paramCount++;
    } else if (entry.repair_date !== undefined && entry.repair_date !== null) {
      const repairDateValue = entry.repair_date && entry.repair_date.trim() !== '' ? convertToPostgresDate(entry.repair_date) : null;
      updates.push(`repair_date = $${paramCount}`);
      values.push(repairDateValue);
      paramCount++;
    }
    if (entry.testing !== undefined && entry.testing !== null) {
      updates.push(`testing = $${paramCount}`);
      values.push(entry.testing);
      paramCount++;
    } else if (entry.testing !== undefined && entry.testing !== null) {
      updates.push(`testing = $${paramCount}`);
      values.push(entry.testing);
      paramCount++;
    }
    if (entry.failure !== undefined && entry.failure !== null) {
      updates.push(`failure = $${paramCount}`);
      values.push(entry.failure);
      paramCount++;
    } else if (entry.failure !== undefined && entry.failure !== null) {
      updates.push(`failure = $${paramCount}`);
      values.push(entry.failure);
      paramCount++;
    }
    if (entry.status !== undefined && entry.status !== null) {
      updates.push(`status = $${paramCount}`);
      values.push(entry.status);
      paramCount++;
    } else if (entry.status !== undefined && entry.status !== null) {
      updates.push(`status = $${paramCount}`);
      values.push(entry.status);
      paramCount++;
    }

    if (entry.analysis !== undefined && entry.analysis !== null) {
      updates.push(`analysis = $${paramCount}`);
      values.push(entry.analysis);
      paramCount++;
    } else if (entry.analysis !== undefined && entry.analysis !== null) {
      updates.push(`analysis = $${paramCount}`);
      values.push(entry.analysis);
      paramCount++;
    }
    // validation_result column has been removed from database
    if (entry.componentChange !== undefined && entry.componentChange !== null) {
      updates.push(`component_change = $${paramCount}`);
      values.push(entry.componentChange);
      paramCount++;
    } else if (entry.component_change !== undefined && entry.component_change !== null) {
      updates.push(`component_change = $${paramCount}`);
      values.push(entry.component_change);
      paramCount++;
    }
    if (entry.enggName !== undefined && entry.enggName !== null) {
      updates.push(`engg_name = $${paramCount}`);
      values.push(entry.enggName);
      paramCount++;
    } else if (entry.engg_name !== undefined && entry.engg_name !== null) {
      updates.push(`engg_name = $${paramCount}`);
      values.push(entry.engg_name);
      paramCount++;
    }

    // Handle new separate engineer name fields
    if (entry.tagEntryBy !== undefined && entry.tagEntryBy !== null) {
      updates.push(`tag_entry_by = $${paramCount}`);
      values.push(entry.tagEntryBy);
      paramCount++;
    } else if (entry.tag_entry_by !== undefined && entry.tag_entry_by !== null) {
      updates.push(`tag_entry_by = $${paramCount}`);
      values.push(entry.tag_entry_by);
      paramCount++;
    }
    if (entry.consumptionEntryBy !== undefined && entry.consumptionEntryBy !== null) {
      updates.push(`consumption_entry_by = $${paramCount}`);
      values.push(entry.consumptionEntryBy);
      paramCount++;
    } else if (entry.consumption_entry_by !== undefined && entry.consumption_entry_by !== null) {
      updates.push(`consumption_entry_by = $${paramCount}`);
      values.push(entry.consumption_entry_by);
      paramCount++;
    }
    if (entry.dispatchEntryBy !== undefined && entry.dispatchEntryBy !== null) {
      updates.push(`dispatch_entry_by = $${paramCount}`);
      values.push(entry.dispatchEntryBy);
      paramCount++;
    } else if (entry.dispatch_entry_by !== undefined && entry.dispatch_entry_by !== null) {
      updates.push(`dispatch_entry_by = $${paramCount}`);
      values.push(entry.dispatch_entry_by);
      paramCount++;
    }

    if ((entry.dispatchDate !== undefined && entry.dispatchDate !== null) || (entry.dispatch_date !== undefined && entry.dispatch_date !== null)) {
      const dispatchDateValue = (entry.dispatchDate || entry.dispatch_date) && (entry.dispatchDate || entry.dispatch_date).trim() !== '' ? convertToPostgresDate(entry.dispatchDate || entry.dispatch_date) : null;
      updates.push(`dispatch_date = $${paramCount}`);
      values.push(dispatchDateValue);
      paramCount++;
    }

    if (updates.length === 0) {
      console.log('No fields to update');
      return true; // Nothing to update, but not an error
    }

    // Add updated_at and product_sr_no to the end
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(productSrNo);

    const query = `UPDATE consolidated_data SET ${updates.join(', ')} WHERE product_sr_no = $${paramCount}`;

    console.log('Executing query:', query);
    console.log('With values:', values);

    const result = await pool.query(query, values);

    console.log('Query result:', result);
    console.log('Rows affected:', result.rowCount);

    return true;
  } catch (error) {
    console.error('Error updating consolidated data entry by product_sr_no:', error);
    return false;
  }
}

// Test function to verify database updates are working
export async function testDatabaseUpdate(): Promise<boolean> {
  try {
    console.log('Testing database update...');

    // First, try to get a test record
    const testResult = await pool.query(
      'SELECT product_sr_no FROM consolidated_data LIMIT 1'
    );

    if (testResult.rows.length === 0) {
      console.log('No records found in consolidated_data table');
      return false;
    }

    const testProductSrNo = testResult.rows[0].product_sr_no;
    console.log('Testing update for product_sr_no:', testProductSrNo);

    // Try a simple update
    const updateResult = await pool.query(
      'UPDATE consolidated_data SET updated_at = CURRENT_TIMESTAMP WHERE product_sr_no = $1',
      [testProductSrNo]
    );

    console.log('Test update result:', updateResult);
    console.log('Rows affected:', updateResult.rowCount);

    return (updateResult.rowCount || 0) > 0;
  } catch (error) {
    console.error('Error testing database update:', error);
    return false;
  }
}

// Engineer service functions
export async function getAllEngineers(): Promise<{ id: number, name: string }[]> {
  try {
    const result = await pool.query(
      'SELECT id, name FROM engineers ORDER BY name ASC'
    );

    return result.rows;
  } catch (error) {
    console.error('Error fetching engineers:', error);
    return [];
  }
}

export async function addEngineer(name: string): Promise<boolean> {
  try {
    await pool.query(
      'INSERT INTO engineers (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
      [name.trim()]
    );

    return true;
  } catch (error) {
    console.error('Error adding engineer:', error);
    return false;
  }
}

export async function deleteEngineer(id: number): Promise<boolean> {
  try {
    await pool.query(
      'DELETE FROM engineers WHERE id = $1',
      [id]
    );

    return true;
  } catch (error) {
    console.error('Error deleting engineer:', error);
    return false;
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
export async function getAllDcNumbers(): Promise<{ dcNumber: string, partCodes: string[] }[]> {
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

// Save consolidated data entry with session-scoped DC Number and Partcode
export async function saveConsolidatedDataEntry(entry: any, sessionDcNumber?: string, sessionPartcode?: string): Promise<boolean> {
  try {
    console.log('=== saveConsolidatedDataEntry CALLED ===');
    console.log('Input entry:', entry);
    console.log('Session data - DC Number:', sessionDcNumber, 'Partcode:', sessionPartcode);

    // Validate required fields
    const requiredFields = ['srNo', 'dcNo', 'productSrNo', 'complaintNo'];
    const missingFields = requiredFields.filter(field => !entry[field]);

    if (missingFields.length > 0) {
      console.log('MISSING REQUIRED FIELDS:', missingFields);
      return false;
    }

    console.log('All required fields present');

    // Handle empty dates by converting them to NULL
    const dcDateValue = entry.dcDate && entry.dcDate.trim() !== '' ? convertToPostgresDate(entry.dcDate) : null;
    const dateOfPurchaseValue = entry.dateOfPurchase && entry.dateOfPurchase.trim() !== '' ? convertToPostgresDate(entry.dateOfPurchase) : null;
    const repairDateValue = entry.repairDate && entry.repairDate.trim() !== '' ? convertToPostgresDate(entry.repairDate) : null;
    const dispatchDateValue = entry.dispatchDate && entry.dispatchDate.trim() !== '' ? convertToPostgresDate(entry.dispatchDate) : null;

    console.log('Converted dates - DC:', dcDateValue, 'Purchase:', dateOfPurchaseValue, 'Repair:', repairDateValue, 'Dispatch:', dispatchDateValue);

    console.log('Executing database insert...');
    const result = await pool.query(`
      INSERT INTO consolidated_data 
      (sr_no, dc_no, dc_date, branch, bccd_name, product_description, product_sr_no, 
       date_of_purchase, complaint_no, part_code, defect, visiting_tech_name, mfg_month_year,
       repair_date, testing, failure, status, pcb_sr_no, analysis, 
       component_change, engg_name, tag_entry_by, consumption_entry_by, dispatch_entry_by, dispatch_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
      RETURNING id
    `, [
      entry.srNo,
      sessionDcNumber || entry.dcNo,
      dcDateValue,
      entry.branch,
      entry.bccdName,
      entry.productDescription,
      entry.productSrNo,
      dateOfPurchaseValue,
      entry.complaintNo,
      sessionPartcode || entry.partCode,
      entry.defect,
      entry.visitingTechName,
      entry.mfgMonthYear,
      repairDateValue,
      entry.testing,
      entry.failure,
      entry.status,
      entry.pcbSrNo,
      entry.analysis,
      entry.componentChange,
      entry.enggName,
      entry.tagEntryBy,
      entry.consumptionEntryBy,
      entry.dispatchEntryBy,
      dispatchDateValue
    ]);

    console.log('Database insert result:', result);
    console.log('Inserted record ID:', result.rows[0]?.id);

    if (result.rows.length > 0) {
      console.log('SUCCESS: Record inserted with ID:', result.rows[0].id);
      return true;
    } else {
      console.log('WARNING: No rows returned from insert');
      return false;
    }
  } catch (error) {
    console.error('=== DATABASE SAVE ERROR ===');
    console.error('Error details:', error);

    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

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
    // Build dynamic query based on provided fields
    const updates = [];
    const values = [];
    let paramCount = 1;

    // Handle tag entry fields (only update if provided)
    if (entry.srNo !== undefined && entry.srNo !== null) {
      updates.push(`sr_no = $${paramCount}`);
      values.push(entry.srNo);
      paramCount++;
    }
    if (entry.dcNo !== undefined && entry.dcNo !== null) {
      updates.push(`dc_no = $${paramCount}`);
      values.push(entry.dcNo);
      paramCount++;
    }
    if (entry.dcDate !== undefined && entry.dcDate !== null) {
      const dcDateValue = entry.dcDate && entry.dcDate.trim() !== '' ? convertToPostgresDate(entry.dcDate) : null;
      updates.push(`dc_date = $${paramCount}`);
      values.push(dcDateValue);
      paramCount++;
    }
    if (entry.branch !== undefined && entry.branch !== null) {
      updates.push(`branch = $${paramCount}`);
      values.push(entry.branch);
      paramCount++;
    }
    if (entry.bccdName !== undefined && entry.bccdName !== null) {
      updates.push(`bccd_name = $${paramCount}`);
      values.push(entry.bccdName);
      paramCount++;
    }
    if (entry.productDescription !== undefined && entry.productDescription !== null) {
      updates.push(`product_description = $${paramCount}`);
      values.push(entry.productDescription);
      paramCount++;
    }
    if (entry.productSrNo !== undefined && entry.productSrNo !== null) {
      updates.push(`product_sr_no = $${paramCount}`);
      values.push(entry.productSrNo);
      paramCount++;
    }
    if (entry.dateOfPurchase !== undefined && entry.dateOfPurchase !== null) {
      const dateOfPurchaseValue = entry.dateOfPurchase && entry.dateOfPurchase.trim() !== '' ? convertToPostgresDate(entry.dateOfPurchase) : null;
      updates.push(`date_of_purchase = $${paramCount}`);
      values.push(dateOfPurchaseValue);
      paramCount++;
    }
    if (entry.complaintNo !== undefined && entry.complaintNo !== null) {
      updates.push(`complaint_no = $${paramCount}`);
      values.push(entry.complaintNo);
      paramCount++;
    }
    if (entry.partCode !== undefined && entry.partCode !== null) {
      updates.push(`part_code = $${paramCount}`);
      values.push(entry.partCode);
      paramCount++;
    }
    if (entry.defect !== undefined && entry.defect !== null) {
      updates.push(`defect = $${paramCount}`);
      values.push(entry.defect);
      paramCount++;
    }
    if (entry.visitingTechName !== undefined && entry.visitingTechName !== null) {
      updates.push(`visiting_tech_name = $${paramCount}`);
      values.push(entry.visitingTechName);
      paramCount++;
    }
    if (entry.mfgMonthYear !== undefined && entry.mfgMonthYear !== null) {
      updates.push(`mfg_month_year = $${paramCount}`);
      values.push(entry.mfgMonthYear);
      paramCount++;
    }
    if (entry.pcbSrNo !== undefined && entry.pcbSrNo !== null) {
      updates.push(`pcb_sr_no = $${paramCount}`);
      values.push(entry.pcbSrNo);
      paramCount++;
    }

    // Handle consumption fields (only update if provided)
    if (entry.repairDate !== undefined && entry.repairDate !== null) {
      const repairDateValue = entry.repairDate && entry.repairDate.trim() !== '' ? convertToPostgresDate(entry.repairDate) : null;
      updates.push(`repair_date = $${paramCount}`);
      values.push(repairDateValue);
      paramCount++;
    }
    if (entry.testing !== undefined && entry.testing !== null) {
      updates.push(`testing = $${paramCount}`);
      values.push(entry.testing);
      paramCount++;
    } else if (entry.testing !== undefined && entry.testing !== null) {
      updates.push(`testing = $${paramCount}`);
      values.push(entry.testing);
      paramCount++;
    }
    if (entry.failure !== undefined && entry.failure !== null) {
      updates.push(`failure = $${paramCount}`);
      values.push(entry.failure);
      paramCount++;
    } else if (entry.failure !== undefined && entry.failure !== null) {
      updates.push(`failure = $${paramCount}`);
      values.push(entry.failure);
      paramCount++;
    }
    if (entry.status !== undefined && entry.status !== null) {
      updates.push(`status = $${paramCount}`);
      values.push(entry.status);
      paramCount++;
    } else if (entry.status !== undefined && entry.status !== null) {
      updates.push(`status = $${paramCount}`);
      values.push(entry.status);
      paramCount++;
    }

    if (entry.analysis !== undefined && entry.analysis !== null) {
      updates.push(`analysis = $${paramCount}`);
      values.push(entry.analysis);
      paramCount++;
    } else if (entry.analysis !== undefined && entry.analysis !== null) {
      updates.push(`analysis = $${paramCount}`);
      values.push(entry.analysis);
      paramCount++;
    }
    // validation_result column has been removed from database
    if (entry.componentChange !== undefined && entry.componentChange !== null) {
      updates.push(`component_change = $${paramCount}`);
      values.push(entry.componentChange);
      paramCount++;
    } else if (entry.component_change !== undefined && entry.component_change !== null) {
      updates.push(`component_change = $${paramCount}`);
      values.push(entry.component_change);
      paramCount++;
    }
    if (entry.enggName !== undefined && entry.enggName !== null) {
      updates.push(`engg_name = $${paramCount}`);
      values.push(entry.enggName);
      paramCount++;
    } else if (entry.engg_name !== undefined && entry.engg_name !== null) {
      updates.push(`engg_name = $${paramCount}`);
      values.push(entry.engg_name);
      paramCount++;
    }

    // Handle new separate engineer name fields
    if (entry.tagEntryBy !== undefined && entry.tagEntryBy !== null) {
      updates.push(`tag_entry_by = $${paramCount}`);
      values.push(entry.tagEntryBy);
      paramCount++;
    } else if (entry.tag_entry_by !== undefined && entry.tag_entry_by !== null) {
      updates.push(`tag_entry_by = $${paramCount}`);
      values.push(entry.tag_entry_by);
      paramCount++;
    }
    if (entry.consumptionEntryBy !== undefined && entry.consumptionEntryBy !== null) {
      updates.push(`consumption_entry_by = $${paramCount}`);
      values.push(entry.consumptionEntryBy);
      paramCount++;
    } else if (entry.consumption_entry_by !== undefined && entry.consumption_entry_by !== null) {
      updates.push(`consumption_entry_by = $${paramCount}`);
      values.push(entry.consumption_entry_by);
      paramCount++;
    }
    if (entry.dispatchEntryBy !== undefined && entry.dispatchEntryBy !== null) {
      updates.push(`dispatch_entry_by = $${paramCount}`);
      values.push(entry.dispatchEntryBy);
      paramCount++;
    } else if (entry.dispatch_entry_by !== undefined && entry.dispatch_entry_by !== null) {
      updates.push(`dispatch_entry_by = $${paramCount}`);
      values.push(entry.dispatch_entry_by);
      paramCount++;
    }

    if (entry.dispatchDate !== undefined && entry.dispatchDate !== null) {
      const dispatchDateValue = entry.dispatchDate && entry.dispatchDate.trim() !== '' ? convertToPostgresDate(entry.dispatchDate) : null;
      updates.push(`dispatch_date = $${paramCount}`);
      values.push(dispatchDateValue);
      paramCount++;
    } else if (entry.dispatch_date !== undefined && entry.dispatch_date !== null) {
      const dispatchDateValue = entry.dispatch_date && entry.dispatch_date.trim() !== '' ? convertToPostgresDate(entry.dispatch_date) : null;
      updates.push(`dispatch_date = $${paramCount}`);
      values.push(dispatchDateValue);
      paramCount++;
    }

    if (updates.length === 0) {
      console.log('No fields to update');
      return true; // Nothing to update, but not an error
    }

    // Add updated_at and id to the end
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `UPDATE consolidated_data SET ${updates.join(', ')} WHERE id = $${paramCount}`;

    await pool.query(query, values);

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

// Search for consolidated data entries by DC number, part code, and product serial number
export async function searchConsolidatedDataEntries(dcNo?: string, partCode?: string, productSrNo?: string): Promise<any[]> {
  try {
    let query = 'SELECT * FROM consolidated_data WHERE TRUE';
    const params: any[] = [];
    let paramCount = 1;

    if (dcNo) {
      query += ` AND dc_no = $${paramCount}`;
      params.push(dcNo);
      paramCount++;
    }

    if (partCode) {
      query += ` AND part_code = $${paramCount}`;
      params.push(partCode);
      paramCount++;
    }

    if (productSrNo) {
      query += ` AND product_sr_no = $${paramCount}`;
      params.push(productSrNo);
      paramCount++;
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Error searching consolidated data entries:', error);
    return [];
  }
}

// Search for consolidated data entries by DC number, part code, and PCB serial number
export async function searchConsolidatedDataEntriesByPcb(dcNo?: string, partCode?: string, pcbSrNo?: string): Promise<any[]> {
  try {
    let query = 'SELECT * FROM consolidated_data WHERE TRUE';
    const params: any[] = [];
    let paramCount = 1;

    // Only add conditions for non-empty parameters
    if (dcNo && dcNo.trim() !== '') {
      query += ` AND dc_no = $${paramCount}`;
      params.push(dcNo);
      paramCount++;
    }

    if (partCode && partCode.trim() !== '') {
      query += ` AND part_code = $${paramCount}`;
      params.push(partCode);
      paramCount++;
    }

    if (pcbSrNo && pcbSrNo.trim() !== '') {
      query += ` AND pcb_sr_no = $${paramCount}`;
      params.push(pcbSrNo);
      paramCount++;
    }

    query += ' ORDER BY created_at DESC';

    console.log('Executing search query:', query, 'with params:', params);

    const result = await pool.query(query, params);
    console.log('Search returned', result.rows.length, 'results');
    return result.rows;
  } catch (error) {
    console.error('Error searching consolidated data entries by PCB:', error);
    return [];
  }
}

// Get consolidated data entries by DC number
export async function getConsolidatedDataEntriesByDcNo(dcNo: string): Promise<any[]> {
  try {
    const result = await pool.query(
      'SELECT * FROM consolidated_data WHERE dc_no = $1 ORDER BY created_at DESC',
      [dcNo]
    );

    return result.rows;
  } catch (error) {
    console.error('Error getting consolidated data entries by DC number:', error);
    return [];
  }
}

// Remove unused columns from consolidated_data table
export async function removeUnusedColumnsFromConsolidatedData() {
  try {
    // Check if rf_observation column exists before attempting to drop it
    const rfObsCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'consolidated_data' AND column_name = 'rf_observation'
    `);

    if (rfObsCheck.rows.length > 0) {
      await pool.query('ALTER TABLE consolidated_data DROP COLUMN rf_observation');
      console.log('Column rf_observation removed successfully');
    } else {
      console.log('Column rf_observation does not exist, skipping');
    }

    // Check if validation_result column exists before attempting to drop it
    const valResCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'consolidated_data' AND column_name = 'validation_result'
    `);

    if (valResCheck.rows.length > 0) {
      await pool.query('ALTER TABLE consolidated_data DROP COLUMN validation_result');
      console.log('Column validation_result removed successfully');
    } else {
      console.log('Column validation_result does not exist, skipping');
    }

    return true;
  } catch (error) {
    console.error('Error removing unused columns from consolidated_data:', error);
    return false;
  }
}

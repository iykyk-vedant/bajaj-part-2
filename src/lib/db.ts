import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Create a connection pool with database specified
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'nexscan',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Initialize the database tables
export async function initializeDatabase() {
  let connection;
  try {
    const databaseName = process.env.MYSQL_DATABASE || 'nexscan';
    
    // Get a connection from the pool
    connection = await pool.getConnection();
    
    // Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\``);
    
    // Use the database
    await connection.query(`USE \`${databaseName}\``);
    
    // Create sheets table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sheets (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL
      )
    `);

    // Create sheet_data table for storing the actual sheet data
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sheet_data (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sheet_id VARCHAR(255) NOT NULL,
        data JSON NOT NULL,
        created_at DATETIME NOT NULL,
        FOREIGN KEY (sheet_id) REFERENCES sheets(id) ON DELETE CASCADE
      )
    `);
    
    // Create BOM table for component validation
    await connection.query(`
      CREATE TABLE IF NOT EXISTS bom (
        id INT AUTO_INCREMENT PRIMARY KEY,
        part_code VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_part_location (part_code, location)
      )
    `);
    
    // Create consumption_entries table with the required fields
    await connection.query(`
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
        consumption_entry_date DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Create dc_numbers table for storing DC numbers and their part codes
    await connection.query(`
      CREATE TABLE IF NOT EXISTS dc_numbers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        dc_number VARCHAR(255) NOT NULL UNIQUE,
        part_codes JSON,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// Export the pool for use in other files
export default pool;

// BOM service functions
export async function getBomDescription(partCode: string, location: string): Promise<string | null> {
  try {
    const [rows]: any = await pool.execute(
      'SELECT description FROM bom WHERE part_code = ? AND location = ?',
      [partCode, location]
    );
    
    if (rows.length > 0) {
      return rows[0].description;
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
    const [rows]: any = await pool.execute(
      'SELECT COUNT(*) as count FROM bom WHERE location = ?',
      [location]
    );
    
    return rows[0].count > 0;
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
    const [rows]: any = await pool.execute(
      'SELECT COUNT(*) as count FROM bom WHERE part_code = ? AND location = ?',
      [partCode, location]
    );
    
    return rows[0].count > 0;
  } catch (error) {
    console.error('Error checking component for part code:', error);
    return false;
  }
}

// DC Number service functions
export async function getAllDcNumbers(): Promise<{dcNumber: string, partCodes: string[]}[]> {
  try {
    const [rows]: any = await pool.execute(
      'SELECT dc_number, part_codes FROM dc_numbers ORDER BY created_at ASC'
    );
    
    return rows.map((row: any) => {
      let partCodes: string[] = [];
      if (row.part_codes) {
        // Check if part_codes is already parsed (object/array) or needs parsing (string)
        if (typeof row.part_codes === 'string') {
          try {
            // Try to parse as JSON first
            partCodes = JSON.parse(row.part_codes);
          } catch (parseError) {
            // If JSON parsing fails, treat as comma-separated string
            partCodes = row.part_codes.split(',').map((code: string) => code.trim()).filter((code: string) => code.length > 0);
          }
        } else if (Array.isArray(row.part_codes)) {
          // Already parsed as array
          partCodes = row.part_codes;
        } else if (typeof row.part_codes === 'object') {
          // Already parsed as object, convert to array
          partCodes = Object.values(row.part_codes);
        }
      }
      return {
        dcNumber: row.dc_number,
        partCodes
      };
    });
  } catch (error) {
    console.error('Error fetching DC numbers:', error);
    return [];
  }
}

export async function addDcNumber(dcNumber: string, partCodes: string[] = []): Promise<boolean> {
  try {
    // Check if DC number already exists
    const [existingRows]: any = await pool.execute(
      'SELECT id FROM dc_numbers WHERE dc_number = ?',
      [dcNumber]
    );
    
    if (existingRows.length > 0) {
      // Update existing record
      await pool.execute(
        'UPDATE dc_numbers SET part_codes = ? WHERE dc_number = ?',
        [JSON.stringify(partCodes), dcNumber]
      );
    } else {
      // Insert new record
      await pool.execute(
        'INSERT INTO dc_numbers (dc_number, part_codes) VALUES (?, ?)',
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
    await pool.execute(
      'UPDATE dc_numbers SET part_codes = ? WHERE dc_number = ?',
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
    await pool.execute(
      'DELETE FROM dc_numbers WHERE dc_number = ?',
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
    const [rows]: any = await pool.execute(
      'SELECT * FROM sheets ORDER BY created_at DESC'
    );
    return rows;
  } catch (error) {
    console.error('Error fetching sheets:', error);
    return [];
  }
}

export async function createSheet(sheet: any): Promise<any> {
  try {
    const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await pool.execute(
      'INSERT INTO sheets (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)',
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
    const updatedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await pool.execute(
      'UPDATE sheets SET name = ?, updated_at = ? WHERE id = ?',
      [name, updatedAt, sheetId]
    );
  } catch (error) {
    console.error('Error updating sheet name:', error);
    throw error;
  }
}

export async function deleteSheet(sheetId: string): Promise<void> {
  try {
    await pool.execute(
      'DELETE FROM sheets WHERE id = ?',
      [sheetId]
    );
  } catch (error) {
    console.error('Error deleting sheet:', error);
    throw error;
  }
}

export async function addDataToSheet(sheetId: string, data: any): Promise<void> {
  try {
    const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await pool.execute(
      'INSERT INTO sheet_data (sheet_id, data, created_at) VALUES (?, ?, ?)',
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
    await pool.execute(
      'DELETE FROM sheet_data WHERE sheet_id = ?',
      [sheetId]
    );
    
    // Then insert new data
    for (const item of data) {
      const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
      await pool.execute(
        'INSERT INTO sheet_data (sheet_id, data, created_at) VALUES (?, ?, ?)',
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
    await pool.execute(
      'DELETE FROM sheet_data WHERE sheet_id = ?',
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
    const [countRows]: any = await pool.execute('SELECT COUNT(*) as count FROM bom');
    if (countRows[0].count > 0) {
      return; // Already has data
    }
    
    // Add sample BOM entries
    const sampleBomData = [
      ['RES-001', 'R1', '1K Ohm Resistor'],
      ['CAP-001', 'C1', '10uF Capacitor'],
      ['IC-001', 'U1', 'Microcontroller'],
      ['LED-001', 'D1', 'Red LED'],
      ['CONN-001', 'J1', 'Power Connector']
    ];
    
    for (const [partCode, location, description] of sampleBomData) {
      await pool.execute(
        'INSERT IGNORE INTO bom (part_code, location, description) VALUES (?, ?, ?)',
        [partCode, location, description]
      );
    }
    
    console.log('Sample BOM data added successfully');
  } catch (error) {
    console.error('Error adding sample BOM data:', error);
  }
}
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
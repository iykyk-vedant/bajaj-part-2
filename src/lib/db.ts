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
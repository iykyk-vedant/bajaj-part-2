const dotenv = require('dotenv');
dotenv.config();

async function checkPartCode() {
  try {
    console.log('Checking part code 971040...');
    
    const mysql = require('mysql2/promise');
    
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
    
    // Check if part code 971040 exists
    const [rows] = await pool.execute(
      'SELECT * FROM bom WHERE part_code = ?', 
      ['971040']
    );
    
    console.log('BOM entries for part code 971040:', rows);
    
    // Check if R1 location exists for any part code
    const [locationRows] = await pool.execute(
      'SELECT * FROM bom WHERE location = ?', 
      ['R1']
    );
    
    console.log('BOM entries for location R1:', locationRows);
    
    // Close pool
    await pool.end();
  } catch (error) {
    console.error('Check failed:', error);
  }
}

checkPartCode();
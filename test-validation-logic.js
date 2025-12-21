const dotenv = require('dotenv');
dotenv.config();

// Simple test to check database connection and BOM data
async function testBomQuery() {
  try {
    console.log('Testing BOM query directly...');
    
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
    
    // Test direct query
    const [rows] = await pool.execute(
      'SELECT * FROM bom WHERE part_code = ? AND location = ?', 
      ['RES-001', 'R1']
    );
    
    console.log('Direct database query result:', rows);
    
    if (rows.length > 0) {
      console.log('Found BOM entry:');
      console.log('- Part Code:', rows[0].part_code);
      console.log('- Location:', rows[0].location);
      console.log('- Description:', rows[0].description);
    } else {
      console.log('No BOM entry found for RES-001@R1');
    }
    
    // Close pool
    await pool.end();
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testBomQuery();
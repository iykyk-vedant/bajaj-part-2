import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function debugBom() {
  try {
    console.log('Debugging BOM data...');
    
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
    
    // Check what's in the BOM table
    const [rows]: any = await pool.execute('SELECT * FROM bom LIMIT 10');
    console.log('BOM entries:');
    console.log(rows);
    
    // Check specifically for RES-001@R1
    const [specificRows1]: any = await pool.execute(
      'SELECT * FROM bom WHERE part_code = ? AND location = ?', 
      ['RES-001', 'R1']
    );
    console.log('Specific BOM entry for RES-001@R1:');
    console.log(specificRows1);
    
    // Check specifically for 971039@R2
    const [specificRows2]: any = await pool.execute(
      'SELECT * FROM bom WHERE part_code = ? AND location = ?', 
      ['971039', 'R2']
    );
    console.log('Specific BOM entry for 971039@R2:');
    console.log(specificRows2);
    
    pool.end();
  } catch (error) {
    console.error('Debug failed:', error);
  }
}

debugBom();
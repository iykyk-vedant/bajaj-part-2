import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function debugDb() {
  try {
    console.log('Debugging database connection...');
    
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
    
    // First clean up any existing test data
    await pool.execute('DELETE FROM dc_numbers WHERE dc_number = ?', ['DEBUG-TEST-DC']);
    console.log('Cleaned up existing test data');
    
    // Insert a test record directly
    const testPartCodes = ['DEBUG-PART-1', 'DEBUG-PART-2'];
    const [insertResult]: any = await pool.execute(
      'INSERT INTO dc_numbers (dc_number, part_codes) VALUES (?, ?)',
      ['DEBUG-TEST-DC', JSON.stringify(testPartCodes)]
    );
    console.log('Direct insert result:', insertResult);
    
    // Check what's actually in the database
    const [rows]: any = await pool.execute('SELECT * FROM dc_numbers WHERE dc_number = ?', ['DEBUG-TEST-DC']);
    console.log('Raw database rows:', rows);
    
    if (rows.length > 0) {
      console.log('Part codes from DB:', rows[0].part_codes);
      console.log('Type of part codes:', typeof rows[0].part_codes);
      
      // Try to parse the JSON
      try {
        const parsed = JSON.parse(rows[0].part_codes);
        console.log('Parsed part codes:', parsed);
      } catch (parseError) {
        console.log('JSON parse error:', parseError);
      }
    }
    
    // Clean up
    await pool.execute('DELETE FROM dc_numbers WHERE dc_number = ?', ['DEBUG-TEST-DC']);
    console.log('Cleaned up test data');
    
    pool.end();
  } catch (error) {
    console.error('Debug failed:', error);
  }
}

debugDb();
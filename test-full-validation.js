const dotenv = require('dotenv');
dotenv.config();

// Test the full validation flow
async function testFullValidation() {
  try {
    console.log('Testing full validation flow...');
    
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
    
    // Test component: 971039@R2
    const testComponent = '971039@R2';
    console.log(`Testing component: ${testComponent}`);
    
    // Simulate the parsing logic
    const separators = ['@', '-'];
    let partCode = '';
    let location = '';
    
    for (const separator of separators) {
      if (testComponent.includes(separator)) {
        const parts = testComponent.split(separator);
        partCode = parts[0].trim();
        location = parts.slice(1).join(separator).trim();
        console.log(`Parsed -> partCode: '${partCode}', location: '${location}'`);
        break;
      }
    }
    
    // Test database query
    const [rows] = await pool.execute(
      'SELECT description FROM bom WHERE part_code = ? AND location = ?', 
      [partCode, location]
    );
    
    console.log('Database query result:', rows);
    
    if (rows.length > 0) {
      console.log(`Found BOM entry: ${partCode}@${location} - ${rows[0].description}`);
      console.log('This should show as valid in the Component Consumption field');
    } else {
      console.log(`No BOM entry found for ${partCode}@${location}`);
      console.log('This would show as "Not found in BOM" in the Component Consumption field');
    }
    
    // Close pool
    await pool.end();
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testFullValidation();
const dotenv = require('dotenv');
dotenv.config();

async function testLocationOnly() {
  try {
    console.log('Testing location-only input (R1)...');
    
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
    
    // Test input: Just "R1" (location only)
    const testInput = 'R1';
    console.log(`Testing input: ${testInput}`);
    
    // Simulate the parsing logic when there's no separator
    const separators = ['@', '-'];
    let partCode = '';
    let location = '';
    
    for (const separator of separators) {
      if (testInput.includes(separator)) {
        const parts = testInput.split(separator);
        partCode = parts[0].trim();
        location = parts.slice(1).join(separator).trim();
        console.log(`Found separator '${separator}' -> partCode: '${partCode}', location: '${location}'`);
        break;
      }
    }
    
    // If no separator found, treat the whole thing as location
    if (!partCode) {
      location = testInput.trim();
      console.log(`No separator found -> treating as location: '${location}'`);
      
      // Check if this location exists in the BOM
      const [locationRows] = await pool.execute(
        'SELECT * FROM bom WHERE location = ?', 
        [location]
      );
      
      console.log(`Found ${locationRows.length} BOM entries for location '${location}':`);
      if (locationRows.length > 0) {
        console.log('Entries:');
        locationRows.forEach((row, index) => {
          console.log(`  ${index + 1}. Part Code: ${row.part_code}, Description: ${row.description}`);
        });
        console.log('This would show as "Location found with multiple components. Please specify part code."');
      } else {
        console.log('No entries found - this would show as "Not found in BOM"');
      }
    }
    
    // Close pool
    await pool.end();
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testLocationOnly();
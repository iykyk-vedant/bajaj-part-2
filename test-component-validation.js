// Simple test for component validation
const mysql = require('mysql2/promise');

// Load environment variables
require('dotenv').config();

async function testComponentValidation() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'nexscan'
    });
    
    console.log('Connected to database');
    
    // Test the validation function logic directly
    const component = '971039-R1';
    const separators = ['-', '@'];
    let partCode = '';
    let location = '';
    
    console.log(`Parsing component: ${component}`);
    
    // Parse component in format "PARTCODE-LOCATION" or "PARTCODE@LOCATION"
    for (const separator of separators) {
      if (component.includes(separator)) {
        const parts = component.split(separator);
        partCode = parts[0].trim();
        location = parts.slice(1).join(separator).trim();
        console.log(`Parsed - Part Code: ${partCode}, Location: ${location}`);
        break;
      }
    }
    
    // Validate against BOM
    if (partCode && location) {
      console.log(`Querying database for part_code=${partCode} and location=${location}`);
      const [rows] = await connection.execute(
        'SELECT description FROM bom WHERE part_code = ? AND location = ?',
        [partCode, location]
      );
      
      if (rows.length > 0) {
        console.log(`✓ Component ${component} FOUND in BOM`);
        console.log(`  Description: ${rows[0].description}`);
      } else {
        console.log(`✗ Component ${component} NOT FOUND in BOM`);
      }
    } else {
      console.log(`Could not parse component: ${component}`);
    }
    
    // Also test with just "R1" to demonstrate the issue
    console.log('\n--- Testing with just "R1" ---');
    const component2 = 'R1';
    let partCode2 = '';
    let location2 = '';
    
    // Try to parse
    for (const separator of separators) {
      if (component2.includes(separator)) {
        const parts = component2.split(separator);
        partCode2 = parts[0].trim();
        location2 = parts.slice(1).join(separator).trim();
        break;
      }
    }
    
    // If we couldn't parse, treat the whole thing as part code with empty location
    if (!partCode2) {
      partCode2 = component2.trim();
      location2 = '';
    }
    
    console.log(`Parsed - Part Code: ${partCode2}, Location: ${location2}`);
    
    if (partCode2 && location2) {
      const [rows] = await connection.execute(
        'SELECT description FROM bom WHERE part_code = ? AND location = ?',
        [partCode2, location2]
      );
      
      if (rows.length > 0) {
        console.log(`✓ Component ${component2} FOUND in BOM`);
      } else {
        console.log(`✗ Component ${component2} NOT FOUND in BOM`);
      }
    } else if (partCode2) {
      // Check if it's a location
      const [rows] = await connection.execute(
        'SELECT part_code, description FROM bom WHERE location = ?',
        [partCode2]
      );
      
      if (rows.length > 0) {
        console.log(`✓ Location ${component2} FOUND in BOM with ${rows.length} entries:`);
        rows.slice(0, 3).forEach(row => {
          console.log(`  - ${row.part_code}@${component2}: ${row.description}`);
        });
      } else {
        console.log(`✗ Location ${component2} NOT FOUND in BOM`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testComponentValidation();
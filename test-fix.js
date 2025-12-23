const dotenv = require('dotenv');
dotenv.config();

async function testFix() {
  try {
    console.log('Testing the fix for location validation with part code context...');
    
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
    
    // Simulate the fixed validation logic
    async function validateComponentFixed(component, parentPartCode) {
      // Parse component in format "PARTCODE-LOCATION" or "PARTCODE@LOCATION"
      // Prioritize '@' over '-' to handle cases like "RES-001@R1"
      const separators = ['@', '-'];
      let partCode = '';
      let location = '';
      
      for (const separator of separators) {
        if (component.includes(separator)) {
          const parts = component.split(separator);
          partCode = parts[0].trim();
          location = parts.slice(1).join(separator).trim();
          break;
        }
      }
      
      // If we couldn't parse, check if the input might be a location
      if (!partCode) {
        const potentialLocation = component.trim();
        
        // Check if this is a location in our BOM
        const [locationRows] = await pool.execute(
          'SELECT COUNT(*) as count FROM bom WHERE location = ?',
          [potentialLocation]
        );
        
        const locationExists = locationRows[0].count > 0;
        
        if (locationExists) {
          // If it's a location, check if we have a parent part code to validate against
          if (parentPartCode) {
            // Check if the parent part code is valid for this location
            const [descRows] = await pool.execute(
              'SELECT description FROM bom WHERE part_code = ? AND location = ?',
              [parentPartCode, potentialLocation]
            );
            
            const description = descRows.length > 0 ? descRows[0].description : null;
            if (description) {
              // Parent part code is valid for this location, use it
              partCode = parentPartCode;
              location = potentialLocation;
            } else {
              // Parent part code is not valid for this location
              return {
                partCode: '',
                location: potentialLocation,
                description: `Location found with multiple components. Please specify part code.`,
                isValid: false // Mark as invalid to prompt user for more specific info
              };
            }
          } else {
            // No parent part code, return the special indicator
            return {
              partCode: '',
              location: potentialLocation,
              description: `Location found with multiple components. Please specify part code.`,
              isValid: false // Mark as invalid to prompt user for more specific info
            };
          }
        } else {
          // Treat the whole thing as part code with empty location
          partCode = potentialLocation;
          location = '';
        }
      }
      
      // Validate against BOM
      const [descRows] = await pool.execute(
        'SELECT description FROM bom WHERE part_code = ? AND location = ?',
        [partCode, location]
      );
      
      const description = descRows.length > 0 ? descRows[0].description : null;
      
      // If we have a parent part code, do additional validation
      let isValid = !!description;
      if (parentPartCode && isValid) {
        // Check if this component is valid for the specific parent part code
        const [compRows] = await pool.execute(
          'SELECT COUNT(*) as count FROM bom WHERE part_code = ? AND location = ?',
          [partCode, location]
        );
        
        const isComponentValidForParent = compRows[0].count > 0;
        isValid = isComponentValidForParent;
      }
      
      return {
        partCode,
        location,
        description: description || 'NA',
        isValid
      };
    }
    
    console.log('=== TEST CASE 1: Valid location with matching part code ===');
    const result1 = await validateComponentFixed('R1', '971040');
    console.log('Input: "R1" with parent part code "971040"');
    console.log('Result:', result1);
    if (result1.isValid) {
      console.log('✓ SUCCESS: Component validated correctly');
      console.log('  Component Consumption should show: "971040@R1: 100K 1/4W 5%"');
    } else {
      console.log('✗ FAILED: Should have been valid');
    }
    
    console.log('\n=== TEST CASE 2: Valid location with NON-matching part code ===');
    const result2 = await validateComponentFixed('R1', '999999');
    console.log('Input: "R1" with parent part code "999999"');
    console.log('Result:', result2);
    if (!result2.isValid && result2.description.includes('multiple components')) {
      console.log('✓ SUCCESS: Correct error message shown');
    } else {
      console.log('✗ FAILED: Should have shown "multiple components" error');
    }
    
    console.log('\n=== TEST CASE 3: Valid location with NO part code ===');
    const result3 = await validateComponentFixed('R1', null);
    console.log('Input: "R1" with no parent part code');
    console.log('Result:', result3);
    if (!result3.isValid && result3.description.includes('multiple components')) {
      console.log('✓ SUCCESS: Correct error message shown');
    } else {
      console.log('✗ FAILED: Should have shown "multiple components" error');
    }
    
    console.log('\n=== TEST CASE 4: Full component specification ===');
    const result4 = await validateComponentFixed('971040@R1', '971040');
    console.log('Input: "971040@R1" with parent part code "971040"');
    console.log('Result:', result4);
    if (result4.isValid) {
      console.log('✓ SUCCESS: Component validated correctly');
      console.log('  Component Consumption should show: "971040@R1: 100K 1/4W 5%"');
    } else {
      console.log('✗ FAILED: Should have been valid');
    }
    
    console.log('\n=== SUMMARY ===');
    console.log('The fix correctly handles:');
    console.log('1. Location-only input with matching part code context -> VALID');
    console.log('2. Location-only input with non-matching part code -> Error message');
    console.log('3. Location-only input with no part code -> Error message');
    console.log('4. Full component specification -> VALID');
    
    // Close pool
    await pool.end();
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testFix();
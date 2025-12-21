const dotenv = require('dotenv');
dotenv.config();

async function testCorrectFormat() {
  try {
    console.log('Testing correct format input...');
    
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
    
    // Simulate the validation logic
    async function validateComponent(component, parentPartCode) {
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
          // If it's a location, return a special indicator
          return {
            partCode: '',
            location: potentialLocation,
            description: `Location found with multiple components. Please specify part code.`,
            isValid: false // Mark as invalid to prompt user for more specific info
          };
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
    
    // Test cases
    const testCases = [
      { input: '971040@R1', parentPartCode: null, description: 'Correct format without parent part code' },
      { input: 'R1', parentPartCode: '971040', description: 'Location only with parent part code' },
      { input: '971040', parentPartCode: null, description: 'Part code only' }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n--- ${testCase.description} ---`);
      console.log(`Input: "${testCase.input}", Parent Part Code: ${testCase.parentPartCode || 'null'}`);
      
      const result = await validateComponent(testCase.input, testCase.parentPartCode || undefined);
      console.log('Result:', result);
      
      if (result.isValid) {
        console.log(`✓ Valid component: ${result.partCode}@${result.location} - ${result.description}`);
      } else if (result.location && !result.partCode) {
        console.log(`⚠ Location found with multiple components. Please specify part code.`);
      } else {
        console.log(`✗ Component not found in BOM`);
      }
    }
    
    // Close pool
    await pool.end();
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testCorrectFormat();
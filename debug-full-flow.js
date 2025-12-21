const dotenv = require('dotenv');
dotenv.config();

async function debugFullFlow() {
  try {
    console.log('Debugging the full flow step by step...');
    
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
    
    // Simulate the exact scenario you described:
    console.log('=== DEBUGGING SCENARIO ===');
    console.log('1. User finds PCB with DC number and part code');
    const selectedDcNo = 'DC123456'; // This would come from dropdown
    const selectedPartCode = '971040'; // This would come from dropdown
    console.log(`   Selected DC: ${selectedDcNo}`);
    console.log(`   Selected Part Code: ${selectedPartCode}`);
    
    console.log('\n2. User enters analysis text');
    const analysisText = 'R1'; // Just the location
    console.log(`   Analysis text: "${analysisText}"`);
    
    console.log('\n3. System processes analysis with part code context');
    
    // Simulate the actual validation flow:
    // First clean the text
    const DEFECT_KEYWORDS = ['FAULTY', 'DAMAGE', 'BURN', 'DEFECTIVE', 'BAD', 'ERROR'];
    let cleanedText = analysisText.toUpperCase();
    for (const keyword of DEFECT_KEYWORDS) {
      cleanedText = cleanedText.replace(new RegExp(keyword, 'g'), '');
    }
    cleanedText = cleanedText.trim();
    console.log(`   Cleaned text: "${cleanedText}"`);
    
    // Parse components by "/" delimiter
    const componentStrings = cleanedText.split('/').map(component => component.trim()).filter(component => component.length > 0);
    console.log(`   Parsed components:`, componentStrings);
    
    // Process each component
    for (const componentStr of componentStrings) {
      console.log(`\n   Processing component: "${componentStr}"`);
      
      // Parse component in format "PARTCODE-LOCATION" or "PARTCODE@LOCATION"
      // Prioritize '@' over '-' to handle cases like "RES-001@R1"
      const separators = ['@', '-'];
      let partCode = '';
      let location = '';
      
      for (const separator of separators) {
        if (componentStr.includes(separator)) {
          const parts = componentStr.split(separator);
          partCode = parts[0].trim();
          location = parts.slice(1).join(separator).trim();
          console.log(`     Found separator '${separator}' -> partCode: '${partCode}', location: '${location}'`);
          break;
        }
      }
      
      // If we couldn't parse, check if the input might be a location
      if (!partCode) {
        const potentialLocation = componentStr.trim();
        console.log(`     No separator found, treating as location: '${potentialLocation}'`);
        
        // Check if this is a location in our BOM
        const [locationRows] = await pool.execute(
          'SELECT COUNT(*) as count FROM bom WHERE location = ?',
          [potentialLocation]
        );
        
        const locationExists = locationRows[0].count > 0;
        console.log(`     Location exists in BOM: ${locationExists}`);
        
        if (locationExists) {
          // Check what part codes are associated with this location
          const [partCodeRows] = await pool.execute(
            'SELECT part_code, description FROM bom WHERE location = ?',
            [potentialLocation]
          );
          
          console.log(`     Found ${partCodeRows.length} part codes for location '${potentialLocation}':`);
          partCodeRows.forEach((row, index) => {
            console.log(`       ${index + 1}. ${row.part_code} - ${row.description}`);
          });
          
          // Check if the selected part code is one of them
          const hasSelectedPartCode = partCodeRows.some(row => row.part_code === selectedPartCode);
          console.log(`     Selected part code ${selectedPartCode} found for this location: ${hasSelectedPartCode}`);
          
          if (hasSelectedPartCode) {
            // Get the description for the selected part code
            const selectedRow = partCodeRows.find(row => row.part_code === selectedPartCode);
            console.log(`     ✓ VALID: ${selectedPartCode}@${potentialLocation} - ${selectedRow.description}`);
            console.log(`     This should appear in Component Consumption field`);
          } else {
            console.log(`     ✗ INVALID: Location found with multiple components. Please specify part code.`);
            console.log(`     This is the error message that should be shown`);
          }
        } else {
          console.log(`     ✗ INVALID: Location not found in BOM`);
        }
      } else {
        // Validate normal component with part code and location
        console.log(`     Validating ${partCode}@${location}`);
        const [descRows] = await pool.execute(
          'SELECT description FROM bom WHERE part_code = ? AND location = ?',
          [partCode, location]
        );
        
        if (descRows.length > 0) {
          console.log(`     ✓ VALID: ${partCode}@${location} - ${descRows[0].description}`);
        } else {
          console.log(`     ✗ INVALID: Component not found in BOM`);
        }
      }
    }
    
    console.log('\n=== EXPECTED BEHAVIOR ===');
    console.log('If user enters "R1" with part code "971040" selected:');
    console.log('- System should recognize "R1" as a location');
    console.log('- System should find that "971040" is valid for location "R1"');
    console.log('- Component Consumption field should show: "971040@R1: 100K 1/4W 5%"');
    console.log('- No error should be shown');
    
    console.log('\nIf user enters "R1" with part code "999999" selected:');
    console.log('- System should recognize "R1" as a location');
    console.log('- System should find that "999999" is NOT valid for location "R1"');
    console.log('- Error message should show: "Location found with multiple components. Please specify part code."');
    
    // Close pool
    await pool.end();
  } catch (error) {
    console.error('Debug failed:', error);
  }
}

debugFullFlow();
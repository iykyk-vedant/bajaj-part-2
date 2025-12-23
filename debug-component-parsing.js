const dotenv = require('dotenv');
dotenv.config();

// Test the component parsing logic directly
async function testComponentParsing() {
  try {
    console.log('Testing component parsing logic...');
    
    // Simulate the parsing logic from consumption-validation-service.ts
    const DEFECT_KEYWORDS = ['FAULTY', 'DAMAGE', 'BURN', 'DEFECTIVE', 'BAD', 'ERROR'];
    
    // Clean text by removing defect keywords
    function cleanComponentText(text) {
      let cleanedText = text.toUpperCase();
      for (const keyword of DEFECT_KEYWORDS) {
        cleanedText = cleanedText.replace(new RegExp(keyword, 'g'), '');
      }
      return cleanedText.trim();
    }
    
    // Parse components by "/" delimiter
    function parseComponents(text) {
      return text.split('/').map(component => component.trim()).filter(component => component.length > 0);
    }
    
    // Test inputs
    const testInputs = ['RES-001@R1', '971039@R2'];
    
    for (const testInput of testInputs) {
      console.log(`\n--- Testing input: ${testInput} ---`);
    
    // Clean and parse
    const cleanedText = cleanComponentText(testInput);
    console.log(`Cleaned text: ${cleanedText}`);
    
    const componentStrings = parseComponents(cleanedText);
    console.log(`Parsed components:`, componentStrings);
    
    // Test component parsing logic (prioritizing '@' over '-')
    const separators = ['@', '-'];
    for (const componentStr of componentStrings) {
      console.log(`Processing component: ${componentStr}`);
      
      let partCode = '';
      let location = '';
      
      for (const separator of separators) {
        if (componentStr.includes(separator)) {
          const parts = componentStr.split(separator);
          partCode = parts[0].trim();
          location = parts.slice(1).join(separator).trim();
          console.log(`  Found separator '${separator}' -> partCode: '${partCode}', location: '${location}'`);
          break;
        }
      }
      
      if (!partCode) {
        console.log(`  No separator found, treating as location: ${componentStr}`);
      }
    }
  }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testComponentParsing();
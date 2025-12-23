const { validateConsumption } = require('./src/lib/consumption-validation-service');
async function testValidation() {
  try {
    console.log('Testing consumption validation...');
    
    // Test with a component that should exist
    const result1 = await validateConsumption('971039-R1/BAD');
    console.log('Validation result for 971039-R1:', result1);
    
    // Test with just "R1" which is the location, not the part code
    const result2 = await validateConsumption('R1');
    console.log('Validation result for R1:', result2);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testValidation();
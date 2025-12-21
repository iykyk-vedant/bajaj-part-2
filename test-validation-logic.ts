import dotenv from 'dotenv';
import { validateConsumption } from './src/lib/consumption-validation-service.ts';

dotenv.config();

async function testValidation() {
  try {
    console.log('Testing validation logic...');
    
    // Test with a known good component
    const testInput = 'RES-001@R1';
    console.log(`Testing input: ${testInput}`);
    
    const result = await validateConsumption(testInput);
    console.log('Validation result:', JSON.stringify(result, null, 2));
    
    if (result.validatedComponents && result.validatedComponents.length > 0) {
      console.log('First validated component:', result.validatedComponents[0]);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testValidation();
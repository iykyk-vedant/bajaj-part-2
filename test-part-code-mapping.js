const fs = require('fs');

// Read the spare parts data
const sparePartsData = JSON.parse(fs.readFileSync('./src/lib/spare-parts.json', 'utf8'));
const spareParts = sparePartsData.spareParts;

console.log('=== Part Code to Product Description Mapping ===\n');

// Show the mapping
spareParts.forEach(part => {
  console.log(`Part Code: ${part.code} => Product Description: ${part.description}`);
});

console.log('\n=== Test Cases ===\n');

// Test some mappings
const testCodes = ['971040', '974267', '971054'];
testCodes.forEach(code => {
  const part = spareParts.find(p => p.code === code);
  if (part) {
    console.log(`✓ Part Code ${code} maps to: ${part.description}`);
  } else {
    console.log(`✗ Part Code ${code} not found`);
  }
});

console.log('\n=== Summary ===');
console.log(`Total part codes available: ${spareParts.length}`);
console.log('The ConsumptionTab component now automatically populates product descriptions when a part code is selected.');
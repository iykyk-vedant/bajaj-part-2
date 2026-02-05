const { getPcbNumberForDc } = require('./src/lib/pcb-utils');

console.log('Testing PCB Generation Logic...');
try {
    const result = getPcbNumberForDc('10001', '2', '02/2026');
    console.log('Result for 02/2026:', result);

    const result2 = getPcbNumberForDc('10001', '2', '09/2025');
    console.log('Result for 09/2025:', result2);
} catch (error) {
    console.error('Error:', error);
}

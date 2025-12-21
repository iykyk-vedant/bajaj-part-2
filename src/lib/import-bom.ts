import { importBomFromCsv, importBomFromJson, importBomFromExcel } from './bom-import';

async function importBom() {
  try {
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
      console.log('Usage:');
      console.log('  tsx src/lib/import-bom.ts csv <path-to-csv-file>');
      console.log('  tsx src/lib/import-bom.ts json <path-to-json-file>');
      console.log('  tsx src/lib/import-bom.ts excel <path-to-excel-file>');
      console.log('');
      console.log('Examples:');
      console.log('  tsx src/lib/import-bom.ts csv ./bom-data.csv');
      console.log('  tsx src/lib/import-bom.ts json ./bom-data.json');
      console.log('  tsx src/lib/import-bom.ts excel ./bom-data.xlsx');
      process.exit(1);
    }
    
    const format = args[0].toLowerCase();
    const filePath = args[1];
    
    if (format === 'csv') {
      const result = await importBomFromCsv(filePath);
      console.log(result.message);
      process.exit(result.success ? 0 : 1);
    } else if (format === 'json') {
      const result = await importBomFromJson(filePath);
      console.log(result.message);
      process.exit(result.success ? 0 : 1);
    } else if (format === 'excel') {
      const result = await importBomFromExcel(filePath);
      console.log(result.message);
      process.exit(result.success ? 0 : 1);
    } else {
      console.error('Invalid format. Use "csv", "json", or "excel"');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error importing BOM:', error);
    process.exit(1);
  }
}

importBom();
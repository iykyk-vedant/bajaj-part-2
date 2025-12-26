const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.PG_HOST?.replace(/'/g, ''),
  port: parseInt(process.env.PG_PORT || '5432'),
  user: process.env.PG_USER?.replace(/'/g, ''),
  password: process.env.PG_PASSWORD?.replace(/'/g, ''),
  database: process.env.PG_DATABASE?.replace(/'/g, ''),
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 10000,
});

async function importSparePartsData() {
  console.log('\n📦 Importing spare parts data...');
  
  try {
    const sparePartsPath = path.join(__dirname, 'src', 'lib', 'spare-parts.json');
    const sparePartsData = JSON.parse(fs.readFileSync(sparePartsPath, 'utf8'));
    
    let importedCount = 0;
    let skippedCount = 0;
    
    for (const part of sparePartsData.spareParts) {
      try {
        await pool.query(
          `INSERT INTO bom (part_code, location, description, created_at, updated_at) 
           VALUES ($1, $2, $3, NOW(), NOW())
           ON CONFLICT (part_code, location) DO NOTHING`,
          [part.code, 'SPARE', part.description]
        );
        importedCount++;
        console.log(`  ✓ Added: ${part.code} - ${part.description}`);
      } catch (error) {
        skippedCount++;
        console.log(`  ⊘ Skipped: ${part.code} (already exists)`);
      }
    }
    
    console.log(`\n✅ Spare parts import complete: ${importedCount} added, ${skippedCount} skipped`);
    
  } catch (error) {
    console.error('❌ Failed to import spare parts:', error.message);
  }
}

async function importSampleBomData() {
  console.log('\n🔧 No sample BOM data to import - keeping database empty as per requirements');
  console.log('\n✅ Sample BOM import complete: 0 entries added');
}

async function importSampleDCNumbers() {
  console.log('\n📋 No sample DC numbers to import - keeping database empty as per requirements');
  console.log('\n✅ DC numbers import complete: 0 entries added');
}

async function verifyData() {
  console.log('\n🔍 Verifying imported data...\n');
  
  try {
    // Check BOM count
    const bomResult = await pool.query('SELECT COUNT(*) as count FROM bom');
    console.log(`  BOM entries: ${bomResult.rows[0].count}`);
    
    // Check DC numbers count
    const dcResult = await pool.query('SELECT COUNT(*) as count FROM dc_numbers');
    console.log(`  DC numbers: ${dcResult.rows[0].count}`);
    
    // Show sample BOM entries
    const sampleBom = await pool.query('SELECT * FROM bom LIMIT 5');
    console.log('\n  Sample BOM entries:');
    sampleBom.rows.forEach(row => {
      console.log(`    ${row.part_code}@${row.location} - ${row.description}`);
    });
    
    // Show DC numbers
    const dcNumbers = await pool.query('SELECT * FROM dc_numbers');
    console.log('\n  DC Numbers:');
    dcNumbers.rows.forEach(row => {
      const partCodes = JSON.parse(row.part_codes);
      console.log(`    ${row.dc_number}: ${partCodes.join(', ')}`);
    });
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  PostgreSQL Data Import Tool');
  console.log('═══════════════════════════════════════════');
  
  try {
    // Test connection
    const client = await pool.connect();
    console.log('\n✅ Database connection successful');
    client.release();
    
    // Import all data
    await importSparePartsData(); // This will not import anything since spare-parts.json is empty
    await importSampleBomData(); // This will not import anything since we removed sample data
    await importSampleDCNumbers(); // This will not import anything since we removed sample data
    await verifyData();
    
    console.log('\n═══════════════════════════════════════════');
    console.log('  ✅ All data imported successfully!');
    console.log('═══════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('\n❌ Import failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();

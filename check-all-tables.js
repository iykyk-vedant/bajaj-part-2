const { Pool } = require('pg');
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

async function checkAllTables() {
  console.log('═══════════════════════════════════════════');
  console.log('  PostgreSQL Database Tables Status');
  console.log('═══════════════════════════════════════════\n');
  
  try {
    // Get all tables
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log(`📊 Total tables: ${tablesResult.rows.length}\n`);

    for (const { table_name } of tablesResult.rows) {
      // Get row count for each table
      const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${table_name}`);
      const count = countResult.rows[0].count;

      // Get column information
      const columnsResult = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
      `, [table_name]);

      console.log(`📋 Table: ${table_name.toUpperCase()}`);
      console.log(`   Records: ${count}`);
      console.log(`   Columns: ${columnsResult.rows.map(c => c.column_name).join(', ')}`);
      
      // Show sample data if available
      if (parseInt(count) > 0) {
        const sampleResult = await pool.query(`SELECT * FROM ${table_name} LIMIT 3`);
        console.log(`   Sample data:`);
        sampleResult.rows.forEach((row, idx) => {
          const preview = JSON.stringify(row).substring(0, 100);
          console.log(`     ${idx + 1}. ${preview}${preview.length >= 100 ? '...' : ''}`);
        });
      }
      console.log('');
    }

    console.log('═══════════════════════════════════════════');
    console.log('  ✅ Database check complete!');
    console.log('═══════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error checking tables:', error.message);
  } finally {
    await pool.end();
  }
}

checkAllTables();

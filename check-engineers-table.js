const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.PG_HOST?.replace(/'/g, ''),
    port: parseInt(process.env.PG_PORT || '5432'),
    user: process.env.PG_USER?.replace(/'/g, ''),
    password: process.env.PG_PASSWORD?.replace(/'/g, ''),
    database: process.env.PG_DATABASE?.replace(/'/g, ''),
    ssl: process.env.DB_SSL_DISABLED === 'true' ? false : {
        rejectUnauthorized: false
    },
});

async function checkEngineersTable() {
    try {
        console.log('Checking for engineers table...');
        const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'engineers'
      );
    `);

        if (result.rows[0].exists) {
            console.log('✅ engineers table EXISTS');
            const count = await pool.query('SELECT COUNT(*) FROM engineers');
            console.log(`   Current records: ${count.rows[0].count}`);
        } else {
            console.log('❌ engineers table DOES NOT EXIST');
            console.log('   Creating table...');
            await pool.query(`
        CREATE TABLE IF NOT EXISTS engineers (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_engineer_name ON engineers (name);
      `);
            console.log('✅ engineers table CREATED');
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkEngineersTable();

const { Pool } = require('pg');
require('dotenv').config();

// Create a PostgreSQL connection pool
const poolConfig = {
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

// Use DATABASE_URL if provided
if (process.env.DATABASE_URL) {
  Object.assign(poolConfig, {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL_DISABLED === 'true' ? false : {
      rejectUnauthorized: false
    }
  });
} else {
  // Use individual connection parameters
  Object.assign(poolConfig, {
    host: process.env.PG_HOST?.replace(/'/g, '') || 'localhost',
    port: parseInt(process.env.PG_PORT || '5432'),
    user: process.env.PG_USER?.replace(/'/g, '') || 'postgres',
    password: process.env.PG_PASSWORD?.replace(/'/g, '') || '',
    database: process.env.PG_DATABASE?.replace(/'/g, '') || 'nexscan',
    ssl: process.env.DB_SSL_DISABLED === 'true' ? false : {
      rejectUnauthorized: false
    }
  });
}

const pool = new Pool(poolConfig);

async function testConnection() {
  try {
    console.log('Testing database connection...');
    const client = await pool.connect();
    console.log('Database connected successfully!');
    
    // Test the existing consolidated_data table
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'consolidated_data' 
      ORDER BY ordinal_position
    `);
    
    console.log('Current consolidated_data table structure:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type}`);
    });
    
    client.release();
    await pool.end();
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Database connection failed:', error.message);
    await pool.end();
    process.exit(1);
  }
}

testConnection();
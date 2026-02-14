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

async function updateSchema() {
  const client = await pool.connect();
  try {
    console.log('Updating database schema with DC Number and Partcode columns...');
    
    // Add dc_number column if it doesn't exist
    try {
      await client.query(`
        ALTER TABLE consolidated_data 
        ADD COLUMN IF NOT EXISTS dc_number VARCHAR(255)
      `);
      console.log('Added dc_number column successfully');
    } catch (error) {
      console.log('dc_number column may already exist:', error.message);
    }
    
    // Add partcode column if it doesn't exist
    try {
      await client.query(`
        ALTER TABLE consolidated_data 
        ADD COLUMN IF NOT EXISTS partcode VARCHAR(255)
      `);
      console.log('Added partcode column successfully');
    } catch (error) {
      console.log('partcode column may already exist:', error.message);
    }
    
    // Create indexes for better performance
    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_consolidated_data_dc_number 
        ON consolidated_data (dc_number)
      `);
      console.log('Created index on dc_number');
    } catch (error) {
      console.log('Index on dc_number may already exist:', error.message);
    }
    
    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_consolidated_data_partcode 
        ON consolidated_data (partcode)
      `);
      console.log('Created index on partcode');
    } catch (error) {
      console.log('Index on partcode may already exist:', error.message);
    }
    
    // Create composite index for better query performance
    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_consolidated_data_dc_partcode 
        ON consolidated_data (dc_number, partcode)
      `);
      console.log('Created composite index on dc_number and partcode');
    } catch (error) {
      console.log('Composite index may already exist:', error.message);
    }
    
    console.log('Database schema updated successfully!');
  } catch (error) {
    console.error('Error updating database schema:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

updateSchema();
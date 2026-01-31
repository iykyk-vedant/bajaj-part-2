import pool from './pg-db';

async function addDcPartcodeColumns() {
  try {
    console.log('Adding DC Number and Partcode columns to consolidated_data table...');
    
    // Add dc_number column if it doesn't exist
    try {
      await pool.query(`
        ALTER TABLE consolidated_data 
        ADD COLUMN IF NOT EXISTS dc_number VARCHAR(255)
      `);
      console.log('Added dc_number column successfully');
    } catch (error) {
      console.log('dc_number column may already exist:', error);
    }
    
    // Add partcode column if it doesn't exist
    try {
      await pool.query(`
        ALTER TABLE consolidated_data 
        ADD COLUMN IF NOT EXISTS partcode VARCHAR(255)
      `);
      console.log('Added partcode column successfully');
    } catch (error) {
      console.log('partcode column may already exist:', error);
    }
    
    // Create indexes for better performance
    try {
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_consolidated_data_dc_number 
        ON consolidated_data (dc_number)
      `);
      console.log('Created index on dc_number');
    } catch (error) {
      console.log('Index on dc_number may already exist:', error);
    }
    
    try {
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_consolidated_data_partcode 
        ON consolidated_data (partcode)
      `);
      console.log('Created index on partcode');
    } catch (error) {
      console.log('Index on partcode may already exist:', error);
    }
    
    // Create composite index for better query performance
    try {
      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_consolidated_data_dc_partcode 
        ON consolidated_data (dc_number, partcode)
      `);
      console.log('Created composite index on dc_number and partcode');
    } catch (error) {
      console.log('Composite index may already exist:', error);
    }
    
    console.log('Database schema updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating database schema:', error);
    process.exit(1);
  }
}

addDcPartcodeColumns();
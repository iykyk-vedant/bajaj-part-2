import pool from './pg-db';

async function removeTables() {
  try {
    console.log('Removing sheet_data and consumption_entries tables...');
    
    // Remove sheet_data table if it exists
    try {
      await pool.query(`
        DROP TABLE IF EXISTS sheet_data CASCADE
      `);
      console.log('Table sheet_data removed successfully');
    } catch (error) {
      console.error('Error removing sheet_data table:', error);
    }
    
    // Remove consumption_entries table if it exists
    try {
      await pool.query(`
        DROP TABLE IF EXISTS consumption_entries CASCADE
      `);
      console.log('Table consumption_entries removed successfully');
    } catch (error) {
      console.error('Error removing consumption_entries table:', error);
    }
    
    // Update the initializeDatabase function to not recreate these tables
    console.log('Tables removed successfully!');
  } catch (error) {
    console.error('Error during table removal:', error);
    throw error;
  }
}

// Run the removal function
removeTables()
  .then(() => {
    console.log('Table removal process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Table removal process failed:', error);
    process.exit(1);
  });
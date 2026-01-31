import { addDcPartcodeColumnsToConsolidatedData } from './pg-db';

async function updateDatabaseSchema() {
  try {
    console.log('Updating database schema with DC Number and Partcode columns...');
    const success = await addDcPartcodeColumnsToConsolidatedData();
    
    if (success) {
      console.log('Database schema updated successfully!');
    } else {
      console.error('Failed to update database schema');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating database schema:', error);
    process.exit(1);
  }
}

updateDatabaseSchema();
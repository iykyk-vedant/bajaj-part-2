import { removeUnusedColumnsFromConsolidatedData } from './pg-db';

async function removeColumns() {
  try {
    console.log('Removing unused columns from consolidated_data table...');
    const success = await removeUnusedColumnsFromConsolidatedData();
    
    if (success) {
      console.log('Columns removed successfully!');
    } else {
      console.error('Failed to remove columns');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error removing columns:', error);
    process.exit(1);
  }
}

removeColumns();
import { initializeDatabase, addSampleBomData } from './db';

async function initDB() {
  try {
    await initializeDatabase();
    await addSampleBomData();
    console.log('Database initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

initDB();
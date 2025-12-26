import { initializeDatabase, addSampleBomData } from './pg-db';

async function initDB() {
  try {
    await initializeDatabase();
    // Do not add sample data - start with clean database
    console.log('PostgreSQL Database initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Failed to initialize PostgreSQL database:', error);
    process.exit(1);
  }
}

initDB();
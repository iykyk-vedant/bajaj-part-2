import { initializeDatabase } from './pg-db';

async function initDB() {
  try {
    await initializeDatabase();
    // Do not add sample data - start with clean database
    console.log('Database initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

initDB();
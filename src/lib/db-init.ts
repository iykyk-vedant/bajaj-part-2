import { initializeDatabase } from './pg-db';

export async function initializeDatabaseOnStartup() {
  try {
    console.log('Initializing database connection...');
    await initializeDatabase();
    console.log('Database initialized successfully!');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    // In production, we might want to exit if the database is critical
    if (process.env.NODE_ENV === 'production') {
      console.error('Database initialization is critical in production. Application will exit.');
      process.exit(1);
    }
  }
}
import { AppDataSource } from './data-source.js';

class DatabaseInitializer {
  private static instance: DatabaseInitializer;
  private isInitialized = false;
  private initializationPromise: Promise<void>;

  private constructor() {
    this.initializationPromise = AppDataSource.initialize()
      .then(() => {
        this.isInitialized = true;
        console.log('Database initialized successfully');
      })
      .catch(error => {
        console.error('Error initializing database:', error);
        throw error;
      });
  }

  public static getInstance(): DatabaseInitializer {
    if (!DatabaseInitializer.instance) {
      DatabaseInitializer.instance = new DatabaseInitializer();
    }
    return DatabaseInitializer.instance;
  }

  public async ensureInitialized(): Promise<void> {
    await this.initializationPromise;
  }

  public isDatabaseInitialized(): boolean {
    return this.isInitialized;
  }
}

export const databaseInitializer = DatabaseInitializer.getInstance();
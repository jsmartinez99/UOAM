import { AppDataSource } from './data-source.js';
import { seedDatabase } from './seed.js';
import { QdrantAdapter } from '../qdrant/qdrant-client.js';
import { logger } from '../logger.js';

/**
 * Inicializa la base de datos TypeORM.
 *
 * Implementa el patrón Singleton: una sola instancia compartida en toda la app.
 * La inicialización se inicia en el constructor y se completa asíncronamente.
 * ensureInitialized() / ensureSeeded() esperan a que termine.
 */
async function initializeWithRetry(retries = 10, delayMs = 2000): Promise<void> {
  if (AppDataSource.isInitialized) {
    return;
  }
  for (let i = 0; i < retries; i++) {
    try {
      if (AppDataSource.isInitialized) {
        return;
      }
      await AppDataSource.initialize();
      return;
    } catch (error) {
      if (AppDataSource.isInitialized) {
        return;
      }
      if (i === retries - 1) {
        throw error;
      }
      if (process.env.NODE_ENV !== 'test') {
        logger.warn(`Database connection failed. Retrying in ${delayMs / 1000}s... (${i + 1}/${retries})`);
      }
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

class DatabaseInitializer {
  private static instance: DatabaseInitializer;
  private isInitialized = false;
  private initializationPromise: Promise<void>;

  private constructor() {
    this.initializationPromise = initializeWithRetry()
      .then(async () => {
        await AppDataSource.runMigrations();
        this.isInitialized = true;
        if (process.env.NODE_ENV !== 'test') {
          logger.info('Database initialized successfully and migrations run');
        }
      })
      .catch((error) => {
        if (process.env.NODE_ENV !== 'test') {
          logger.error('Error initializing database', error as Error);
        }
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

  public async ensureSeeded(qdrant?: QdrantAdapter): Promise<void> {
    await this.initializationPromise;
    try {
      await seedDatabase(qdrant);
    } catch (err) {
      logger.error('Seed failed', err as Error);
    }
  }

  public isDatabaseInitialized(): boolean {
    return this.isInitialized;
  }
}

export const databaseInitializer = DatabaseInitializer.getInstance();
export { DatabaseInitializer };

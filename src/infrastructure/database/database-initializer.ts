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
class DatabaseInitializer {
  private static instance: DatabaseInitializer;
  private isInitialized = false;
  private initializationPromise: Promise<void>;

  private constructor() {
    this.initializationPromise = AppDataSource.initialize()
      .then(async () => {
        this.isInitialized = true;
        if (process.env.NODE_ENV !== 'test') {
          console.log('Database initialized successfully');
        }
      })
      .catch((error) => {
        if (process.env.NODE_ENV !== 'test') {
          console.error('Error initializing database:', error);
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

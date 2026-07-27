import { DataSource } from 'typeorm';
import { config } from '../../config.js';
import path from 'path';
import { fileURLToPath } from 'url';

const isPostgres = !!process.env.DATABASE_URL;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const AppDataSource = new DataSource(
  isPostgres || config.databaseUrl.includes('postgres')
    ? {
        type: 'postgres',
        url: process.env.DATABASE_URL || config.databaseUrl,
        entities: [path.join(__dirname, 'entities', '*{.js,.ts}')],
        synchronize: true,
        logging: true,
        ssl: false,
      }
    : {
        type: 'better-sqlite3',
        database: ':memory:',
        dropSchema: true,
        entities: [path.join(__dirname, 'entities', '*{.js,.ts}')],
        synchronize: true,
        logging: false,
      }
);


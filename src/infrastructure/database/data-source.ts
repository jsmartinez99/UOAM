import { DataSource } from 'typeorm';
import { config } from '../../config.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isPostgres = config.databaseUrl.startsWith('postgres');

export const AppDataSource = new DataSource(
  isPostgres
    ? {
        type: 'postgres',
        url: config.databaseUrl,
        entities: [path.join(__dirname, 'entities', '*{.js,.ts}')],
        synchronize: true,
        logging: false,
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

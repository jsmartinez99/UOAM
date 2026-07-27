import { DataSource } from 'typeorm';
import { config } from '../../config.js';
import { ArrangerProfileEntity } from './entities/arranger-profile.entity.js';
import { UserEntity } from './entities/user.entity.js';

const isPostgres = config.databaseUrl.startsWith('postgres');

export const AppDataSource = new DataSource(
  isPostgres
    ? {
        type: 'postgres',
        url: config.databaseUrl,
        entities: [ArrangerProfileEntity, UserEntity],
        synchronize: true,
        logging: false,
        ssl: false,
      }
    : {
        type: 'better-sqlite3',
        database: ':memory:',
        dropSchema: true,
        entities: [ArrangerProfileEntity, UserEntity],
        synchronize: true,
        logging: false,
      }
);

export { ArrangerProfileEntity, UserEntity };

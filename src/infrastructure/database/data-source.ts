import { DataSource } from 'typeorm';
import { UserEntity } from './entities/user.entity.js';
import { ArrangerProfileEntity } from './entities/arranger-profile.entity.js';

const isPostgres = !!process.env.DATABASE_URL;

export const AppDataSource = new DataSource(
  isPostgres
    ? {
        type: 'postgres',
        url: process.env.DATABASE_URL,
        entities: [UserEntity, ArrangerProfileEntity],
        synchronize: true,
        logging: false,
      }
    : {
        type: 'better-sqlite3',
        database: ':memory:',
        dropSchema: true,
        entities: [UserEntity, ArrangerProfileEntity],
        synchronize: true,
        logging: false,
      }
);


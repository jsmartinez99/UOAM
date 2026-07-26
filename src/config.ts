import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || 'supersecretkey',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/uoam_db',
  qdrantUrl: process.env.QDRANT_URL || 'http://localhost:6333',
};

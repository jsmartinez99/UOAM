import dotenv from 'dotenv';
import { logger } from './infrastructure/logger.js';

dotenv.config();

const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    if (isTest) {
      return `test-${name.toLowerCase()}`;
    }
    logger.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return value;
}

function optionalEnv(name: string, fallback: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    return fallback;
  }
  return value;
}

export const config = {
  port: Number.parseInt(optionalEnv('PORT', '3000'), 10),
  jwtSecret: isTest ? optionalEnv('JWT_SECRET', 'test-jwt-secret') : requireEnv('JWT_SECRET'),
  databaseUrl: isTest
    ? optionalEnv('DATABASE_URL', 'sqlite::memory:')
    : requireEnv('DATABASE_URL'),
  qdrantUrl: optionalEnv('QDRANT_URL', 'http://localhost:6333'),
  nodeEnv: optionalEnv('NODE_ENV', 'development'),
} as const;

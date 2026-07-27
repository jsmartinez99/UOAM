/**
 * Vitest setup file: set process.env vars BEFORE source code reads them.
 *
 * The `env` block in vitest.config.ts only affects import.meta.env.
 * Source code (config.ts, etc.) reads process.env, so we set it here.
 * This file is loaded as the first setupFile, before any test or source import.
 */
process.env.NODE_ENV = 'test';
process.env.VITEST = 'true';
process.env.DATABASE_URL = 'postgresql://user:password@localhost:5432/uoam_test';
process.env.QDRANT_COLLECTION = 'arrangements_collection_test';
process.env.JWT_SECRET = 'test_jwt_secret_for_vitest_only_minimum_32_chars';
process.env.LLM_PROVIDER = 'mock';
process.env.PORT = '3001';

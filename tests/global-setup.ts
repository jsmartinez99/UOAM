/**
 * Vitest globalSetup: ensures the test database exists.
 *
 * The DB is created on first run; subsequent runs reuse it. Tables are
 * managed by TypeORM's `synchronize: true` (drops & recreates schema on
 * each test file's AppDataSource.initialize()). Data isolation between
 * tests is achieved via beforeEach/afterEach that truncate tables.
 *
 * NOTE: We do NOT drop the database here because that would kill
 * connections held by the test workers (causing "Called end on pool
 * more than once" errors). Instead, we drop and recreate only the
 * public schema, which invalidates tables without killing the pool.
 */
import { execSync } from 'child_process';

const RESET_SQL = `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO user; CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`;

export default function setup() {
  try {
    execSync(`docker exec uoam-db-1 psql -U user -d uoam_test -c "${RESET_SQL}"`, {
      stdio: 'pipe',
    });
  } catch (_e) {
    // DB may not exist yet — create it
    try {
      execSync('docker exec uoam-db-1 psql -U user -d postgres -c "CREATE DATABASE uoam_test;"', {
        stdio: 'pipe',
      });
      execSync(`docker exec uoam-db-1 psql -U user -d uoam_test -c "${RESET_SQL}"`, {
        stdio: 'pipe',
      });
    } catch {
      // Docker/DB not available — tests that need DB will fail gracefully
    }
  }

  // Limpiar colección de Qdrant de tests
  try {
    execSync('curl -s -X DELETE http://localhost:6333/collections/arrangements_collection_test', {
      stdio: 'pipe',
    });
  } catch {
    // ignore
  }
}

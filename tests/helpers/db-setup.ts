/**
 * Test setup: inicializa la conexión a la DB de tests antes de los tests,
 * y la destruye después.
 */
import { AppDataSource } from '../src/infrastructure/database/data-source';

export async function setup() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
}

export async function teardown() {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
}

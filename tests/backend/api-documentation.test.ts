import { describe, it, expect } from 'vitest';
import { swaggerSpec } from '../../src/api/swagger.js';

describe('APIDocumentation', () => {
  // ── Acceso a la documentación ──

  it('debe generar una especificación OpenAPI válida', () => {
    expect(swaggerSpec).toBeDefined();
    expect(swaggerSpec.openapi).toBe('3.0.0');
    expect(swaggerSpec.info).toBeDefined();
    expect(swaggerSpec.info.title).toBe('UOAM Arranger Ecosystem API');
    expect(swaggerSpec.info.version).toBe('1.0.0');
  });

  it('debe contener el esquema Dimensions6D en components', () => {
    expect(swaggerSpec.components).toBeDefined();
    expect(swaggerSpec.components.schemas).toBeDefined();
    expect(swaggerSpec.components.schemas.Dimensions6D).toBeDefined();
    expect(swaggerSpec.components.schemas.Dimensions6D.properties.organology).toBeDefined();
    expect(swaggerSpec.components.schemas.Dimensions6D.properties.harmony).toBeDefined();
    expect(swaggerSpec.components.schemas.Dimensions6D.properties.counterpoint).toBeDefined();
    expect(swaggerSpec.components.schemas.Dimensions6D.properties.texture).toBeDefined();
    expect(swaggerSpec.components.schemas.Dimensions6D.properties.rhythm).toBeDefined();
    expect(swaggerSpec.components.schemas.Dimensions6D.properties.taste).toBeDefined();
  });

  // ── Endpoint documentado ──

  it('debe documentar el endpoint POST /api/v1/auth/login', () => {
    // Buscar el path en los paths generados
    const paths = swaggerSpec.paths || {};
    const loginPath = paths['/api/v1/auth/login'];
    expect(loginPath).toBeDefined();
    expect(loginPath.post).toBeDefined();
    expect(loginPath.post.summary).toBe('Autentica y devuelve un JWT');
  });

  it('debe documentar el endpoint POST /api/v1/hybridize', () => {
    const paths = swaggerSpec.paths || {};
    const hybridPath = paths['/api/v1/hybridize'];
    expect(hybridPath).toBeDefined();
    expect(hybridPath.post).toBeDefined();
    expect(hybridPath.post.summary).toBe('Combina perfiles de arreglistas en un perfil híbrido');
  });

  it('debe documentar el endpoint GET /api/v1/arrangers', () => {
    const paths = swaggerSpec.paths || {};
    const arrPath = paths['/api/v1/arrangers'];
    expect(arrPath).toBeDefined();
    expect(arrPath.get).toBeDefined();
  });
});

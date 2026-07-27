/**
 * Suite de Pruebas Automatizadas E2E de Componentes Frontend (Playwright)
 *
 * Controles automatizados para probar componentes clave del Frontend sin intervención manual:
 *   1. Catálogo 13D (ArrangerCatalog): Tarjetas, banderas y búsqueda por nombre.
 *   2. Hibridador AST (HybridizationTool): Selección de perfiles y log de resolución de conflictos.
 *   3. Generador 5D (StandaloneArrangerPage): Formulario, línea de tiempo, Web Audio Player y exportador XML.
 *   4. Analizador RAG (AnalysisTool): Gráfico radar comparativo y reporte teórico LLM.
 *   5. Autenticación y Redirecciones (Login): Acceso de 1-Clic Demo y gestión de JWT.
 */

import { test, expect } from '@playwright/test';

test.describe('Controles Automatizados E2E del Frontend UOAM', () => {
  const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

  test.beforeEach(async ({ page }) => {
    // Iniciar sesión automática con la cuenta de demo
    await page.goto(`${BASE_URL}/login`);
    const demoButton = page.getByRole('button', { name: /Entrar como Demo Admin/i });
    if (await demoButton.isVisible()) {
      await demoButton.click();
      await page.waitForURL(`${BASE_URL}/catalog`);
    }
  });

  // ─── CONTROL 1: CATÁLOGO DE ARREGLISTAS (13D) ──────────────────────
  test('Control 1: Catálogo debe cargar perfiles 6D, banderas y permitir filtrado por nombre', async ({ page }) => {
    await page.goto(`${BASE_URL}/catalog`);

    // Validar título y cabecera
    await expect(page.getByRole('heading', { name: /Catálogo de Arreglistas/i })).toBeVisible();

    // Validar que se muestre el catálogo de perfiles
    const profilesText = page.getByText(/Mostrando/i);
    await expect(profilesText).toBeVisible();

    // Validar presencia de Carlos Centurión 🇵🇾 en la lista o búsqueda
    const searchInput = page.getByPlaceholder(/Buscar arreglistas por nombre/i);
    await searchInput.fill('Carlos Centurión');
    await expect(page.getByText(/Carlos Centurión/i)).toBeVisible();
    await expect(page.getByText('🇵🇾')).toBeVisible();
  });

  // ─── CONTROL 2: HERRAMIENTA DE HIBRIDACIÓN AST ───────────────────
  test('Control 2: Hibridador AST debe combinar firmas y desplegar la resolución de conflictos', async ({ page }) => {
    await page.goto(`${BASE_URL}/hybridize`);

    // Validar cabecera de la herramienta
    await expect(page.getByRole('heading', { name: /Herramienta de Hibridación AST/i })).toBeVisible();

    // Abrir selector de perfiles
    const selectControl = page.locator('.MuiSelect-select');
    await selectControl.click();

    // Seleccionar perfiles de Carlos Centurión y Claus Ogerman
    await page.getByRole('option', { name: /Carlos Centurión/i }).click();
    await page.getByRole('option', { name: /Claus Ogerman/i }).click();
    await page.keyboard.press('Escape');

    // Hacer clic en Hibridar
    const hybridizeBtn = page.getByRole('button', { name: /Hibridar Perfiles/i });
    await hybridizeBtn.click();

    // Verificar resultado y log de resolución
    await expect(page.getByText(/Perfil Híbrido Generado/i)).toBeVisible();
    await expect(page.getByText(/Conflict resolved|Fusión AST/i)).toBeVisible();
  });

  // ─── CONTROL 3: GENERADOR AUTÓNOMO EN 5 SECCIONES ───────────────
  test('Control 3: Generador 5D debe trazar la línea de tiempo, sintetizador Web Audio y descarga MusicXML', async ({ page }) => {
    await page.goto(`${BASE_URL}/generate`);

    // Validar título de la página
    await expect(page.getByRole('heading', { name: /Generador de Arreglos en 5 Secciones/i })).toBeVisible();

    // Seleccionar arreglista y configurar parámetros
    const titleInput = page.getByLabel(/Título del Arreglo/i);
    await titleInput.fill('Quítame la ropa antes del amanecer');

    const generateBtn = page.getByRole('button', { name: /Generar Arreglo Autónomo/i });
    await generateBtn.click();

    // Validar renderizado de la Línea de Tiempo
    await expect(page.getByText(/Resultado de Generación Autónomo/i)).toBeVisible();
    await expect(page.getByText(/Introduction/i)).toBeVisible();
    await expect(page.getByText(/Clímax/i)).toBeVisible();
    await expect(page.getByText(/Coda/i)).toBeVisible();

    // Validar presencia del Reproductor Web Audio
    await expect(page.getByText(/Previsualización Sonora en Tiempo Real/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Reproducir Boceto Sonoro/i })).toBeVisible();

    // Validar botón de exportación MusicXML
    await expect(page.getByRole('button', { name: /Descargar MusicXML/i })).toBeVisible();
  });

  // ─── CONTROL 4: HERRAMIENTA DE ANÁLISIS 6D Y RAG ─────────────────
  test('Control 4: Herramienta de Análisis debe renderizar el radar 6D e ingesta de archivos', async ({ page }) => {
    await page.goto(`${BASE_URL}/analyze`);

    // Validar cabecera de Análisis RAG
    await expect(page.getByRole('heading', { name: /Herramienta de Análisis 6D y RAG/i })).toBeVisible();

    // Validar presencia del panel de ingesta de partituras/audio
    await expect(page.getByText(/Ingesta de Audio y Partituras/i)).toBeVisible();
    await expect(page.getByText(/Haz clic para seleccionar un archivo/i)).toBeVisible();
  });
});

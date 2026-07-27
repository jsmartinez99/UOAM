# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: frontend-controls.spec.ts >> Controles Automatizados E2E del Frontend UOAM >> Control 3: Generador 5D debe trazar la línea de tiempo, sintetizador Web Audio y descarga MusicXML
- Location: tests/e2e/frontend-controls.spec.ts:75:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/Clímax/i)
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/Clímax/i)

```

```yaml
- banner:
  - heading "UOAM Arranger" [level=6]
  - button "Catálogo"
  - button "Hibridar"
  - button "Generar 5D"
  - button "Analizar"
  - paragraph: admin@uoam.com
  - text: ADMIN A
  - button "Salir"
- main:
  - heading "Generador de Arreglos en 5 Secciones" [level=3]
  - heading "Construye arreglos orquestales autónomos basados en las firmas 6D de arreglistas maestros (Carlos Centurión 🇵🇾, Claus Ogerman, Nelson Riddle, Astor Piazzolla, etc.) trazando la forma completa en 5 secciones." [level=6]
  - text: Arreglista Maestro (Firma 6D)
  - combobox "Arreglista Maestro (Firma 6D)": Nelson Riddle
  - paragraph: Selecciona un perfil técnico del catálogo
  - text: Título del Arreglo / Obra
  - textbox "Título del Arreglo / Obra": Quítame la ropa antes del amanecer
  - text: Tonalidad (Key)
  - textbox "Tonalidad (Key)":
    - /placeholder: ej. Cm, Do menor, Fmaj
    - text: Cm
  - text: Tempo (BPM)
  - spinbutton "Tempo (BPM)": "78"
  - text: Compás (Time Signature)
  - textbox "Compás (Time Signature)":
    - /placeholder: ej. 4/4, 6/8, 3/4
    - text: 4/4
  - button "Generar Arreglo Autónomo"
  - separator
  - heading "Resultado de Generación Autónomo" [level=5]
  - heading "Previsualización Sonora en Tiempo Real (Web Audio)" [level=6]
  - text: Sintetizador Web Audio API | Envolventes dinámicas de las 5 Secciones
  - button "Reproducir Boceto Sonoro"
  - heading "Quítame la ropa antes del amanecer" [level=5]
  - 'heading "Arreglista de Referencia: Nelson Riddle" [level=6]'
  - paragraph:
    - text: "Tonalidad:"
    - strong: Cm
    - text: "| Tempo:"
    - strong: 78 BPM
    - text: "| Compás:"
    - strong: 4/4
  - paragraph: "Asimilación Profesional: 50%"
  - progressbar
  - button "Descargar MusicXML"
  - heading "Línea de Tiempo Formal (5 Secciones)" [level=6]
  - heading "1. Introduction" [level=6]
  - text: "Compases 1 - 8 pp (Pianissimo) Densidad Cap: 20% Instrumentos Activos & Contrapunto 5 Saxes (2 Alto, 2 Tenor, 1 Baritone doubling Flute/Clarinet)"
  - paragraph:
    - text: "Movimiento:"
    - strong: HOMOPHONIC
  - text: "Técnicas Armónicas & Gestos Estéticos Jazz Tonal Extendido Sello: Riddle Lift (Semicorchea de Violines Anticipando Downbeat)"
  - heading "2. Exposition" [level=6]
  - text: "Compases 9 - 24 p (Piano) Densidad Cap: 40% Instrumentos Activos & Contrapunto 5 Saxes (2 Alto, 2 Tenor, 1 Baritone doubling Flute/Clarinet) 4 Trumpets (Harmon/Cup mutes)"
  - paragraph:
    - text: "Movimiento:"
    - strong: CONTRARY
  - text: "Técnicas Armónicas & Gestos Estéticos Jazz Tonal Extendido Acorde Sello C6 (6ª Añadida de Resolución) Sello: Riddle Lift (Semicorchea de Violines Anticipando Downbeat)"
  - heading "3. Development" [level=6]
  - text: "Compases 25 - 40 mf (Mezzo-forte) Densidad Cap: 70% Instrumentos Activos & Contrapunto 5 Saxes (2 Alto, 2 Tenor, 1 Baritone doubling Flute/Clarinet) 4 Trumpets (Harmon/Cup mutes) 4 Trombones 12-16 Strings (Violins/Violas/Cellos/Basses)"
  - paragraph:
    - text: "Movimiento:"
    - strong: CONTRARY
  - text: Técnicas Armónicas & Gestos Estéticos Jazz Tonal Extendido Acorde Sello C6 (6ª Añadida de Resolución) Progresión I - VI7 - IIm7 - V7 - I Tensiones Resueltas Siempre Modulación por Ascenso de 2ª
  - heading "4. Climax" [level=6]
  - text: "Compases 41 - 48 f (Forte) Densidad Cap: 90% Instrumentos Activos & Contrapunto 5 Saxes (2 Alto, 2 Tenor, 1 Baritone doubling Flute/Clarinet) 4 Trumpets (Harmon/Cup mutes) 4 Trombones 12-16 Strings (Violins/Violas/Cellos/Basses) Acoustic Piano & Contrabass (No Electric Bass)"
  - paragraph:
    - text: "Movimiento:"
    - strong: CONTRARY
  - text: "Técnicas Armónicas & Gestos Estéticos Jazz Tonal Extendido Acorde Sello C6 (6ª Añadida de Resolución) Progresión I - VI7 - IIm7 - V7 - I Tensiones Resueltas Siempre Modulación por Ascenso de 2ª Sello: Riddle Lift (Semicorchea de Violines Anticipando Downbeat) Sello: Sutileza Armónica C6 Sello: Melodía como Ley Absoluta Sello: Prefiere Sutileza al Impacto"
  - heading "5. Coda" [level=6]
  - text: "Compases 49 - 56 ppp (Pianississimo) Densidad Cap: 20% Instrumentos Activos & Contrapunto 5 Saxes (2 Alto, 2 Tenor, 1 Baritone doubling Flute/Clarinet)"
  - paragraph:
    - text: "Movimiento:"
    - strong: HOMOPHONIC
  - text: "Técnicas Armónicas & Gestos Estéticos Modulación por Ascenso de 2ª Sello: Early String Exit Sello: Fade Out"
```

# Test source

```ts
  1   | /**
  2   |  * Suite de Pruebas Automatizadas E2E de Componentes Frontend (Playwright)
  3   |  *
  4   |  * Controles automatizados para probar componentes clave del Frontend sin intervención manual:
  5   |  *   1. Catálogo 13D (ArrangerCatalog): Tarjetas, banderas y búsqueda por nombre.
  6   |  *   2. Hibridador AST (HybridizationTool): Selección de perfiles y log de resolución de conflictos.
  7   |  *   3. Generador 5D (StandaloneArrangerPage): Formulario, línea de tiempo, Web Audio Player y exportador XML.
  8   |  *   4. Analizador RAG (AnalysisTool): Gráfico radar comparativo y reporte teórico LLM.
  9   |  *   5. Autenticación y Redirecciones (Login): Acceso de 1-Clic Demo y gestión de JWT.
  10  |  */
  11  | 
  12  | import { test, expect } from '@playwright/test';
  13  | 
  14  | test.describe('Controles Automatizados E2E del Frontend UOAM', () => {
  15  |   const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';
  16  | 
  17  |   test.beforeEach(async ({ page, context }) => {
  18  |     // Login via API para evitar dependencia de la UI de login.
  19  |     // Setear token y user en localStorage antes de cargar la app.
  20  |     const loginRes = await page.request.post(`${BASE_URL}/api/v1/auth/login`, {
  21  |       data: { email: 'admin@uoam.com', password: 'Admin@1234' },
  22  |     });
  23  |     const { token, user } = await loginRes.json();
  24  | 
  25  |     await context.addInitScript(({ token, user }) => {
  26  |       localStorage.setItem('token', token);
  27  |       localStorage.setItem('user', JSON.stringify(user));
  28  |     }, { token, user });
  29  |   });
  30  | 
  31  |   // ─── CONTROL 1: CATÁLOGO DE ARREGLISTAS (13D) ──────────────────────
  32  |   test('Control 1: Catálogo debe cargar perfiles 6D, banderas y permitir filtrado por nombre', async ({ page }) => {
  33  |     await page.goto(`${BASE_URL}/catalog`);
  34  | 
  35  |     // Validar título y cabecera
  36  |     await expect(page.getByRole('heading', { name: /Catálogo de Arreglistas/i })).toBeVisible();
  37  | 
  38  |     // Validar que se muestre el catálogo de perfiles
  39  |     const profilesText = page.getByText(/Mostrando/i);
  40  |     await expect(profilesText).toBeVisible();
  41  | 
  42  |     // Validar presencia de Carlos Centurión 🇵🇾 en la lista o búsqueda
  43  |     const searchInput = page.getByPlaceholder(/Buscar arreglistas por nombre/i);
  44  |     await searchInput.fill('Carlos Centurión');
  45  |     await expect(page.getByText(/Carlos Centurión/i)).toBeVisible();
  46  |     await expect(page.getByText('🇵🇾')).toBeVisible();
  47  |   });
  48  | 
  49  |   // ─── CONTROL 2: HERRAMIENTA DE HIBRIDACIÓN AST ───────────────────
  50  |   test('Control 2: Hibridador AST debe combinar firmas y desplegar la resolución de conflictos', async ({ page }) => {
  51  |     await page.goto(`${BASE_URL}/hybridize`);
  52  | 
  53  |     // Validar cabecera de la herramienta
  54  |     await expect(page.getByRole('heading', { name: /Herramienta de Hibridación AST/i })).toBeVisible();
  55  | 
  56  |     // Abrir selector de perfiles
  57  |     const selectControl = page.locator('.MuiSelect-select');
  58  |     await selectControl.click();
  59  | 
  60  |     // Seleccionar perfiles de Carlos Centurión y Claus Ogerman
  61  |     await page.getByRole('option', { name: /Carlos Centurión/i }).click();
  62  |     await page.getByRole('option', { name: /Claus Ogerman/i }).click();
  63  |     await page.keyboard.press('Escape');
  64  | 
  65  |     // Hacer clic en Hibridar
  66  |     const hybridizeBtn = page.getByRole('button', { name: /Hibridar Perfiles/i });
  67  |     await hybridizeBtn.click();
  68  | 
  69  |     // Verificar resultado y log de resolución
  70  |     await expect(page.getByText(/Perfil Híbrido Generado/i)).toBeVisible();
  71  |     await expect(page.getByText(/Conflict resolved|Fusión AST/i)).toBeVisible();
  72  |   });
  73  | 
  74  |   // ─── CONTROL 3: GENERADOR AUTÓNOMO EN 5 SECCIONES ───────────────
  75  |   test('Control 3: Generador 5D debe trazar la línea de tiempo, sintetizador Web Audio y descarga MusicXML', async ({ page }) => {
  76  |     await page.goto(`${BASE_URL}/generate`);
  77  | 
  78  |     // Validar título de la página
  79  |     await expect(page.getByRole('heading', { name: /Generador de Arreglos en 5 Secciones/i })).toBeVisible();
  80  | 
  81  |     // Seleccionar arreglista y configurar parámetros
  82  |     const titleInput = page.getByLabel(/Título del Arreglo/i);
  83  |     await titleInput.fill('Quítame la ropa antes del amanecer');
  84  | 
  85  |     const generateBtn = page.getByRole('button', { name: /Generar Arreglo Autónomo/i });
  86  |     await generateBtn.click();
  87  | 
  88  |     // Validar renderizado de la Línea de Tiempo
  89  |     await expect(page.getByText(/Resultado de Generación Autónomo/i)).toBeVisible();
  90  |     await expect(page.getByText(/Introduction/i)).toBeVisible();
> 91  |     await expect(page.getByText(/Clímax/i)).toBeVisible();
      |                                             ^ Error: expect(locator).toBeVisible() failed
  92  |     await expect(page.getByText(/Coda/i)).toBeVisible();
  93  | 
  94  |     // Validar presencia del Reproductor Web Audio
  95  |     await expect(page.getByText(/Previsualización Sonora en Tiempo Real/i)).toBeVisible();
  96  |     await expect(page.getByRole('button', { name: /Reproducir Boceto Sonoro/i })).toBeVisible();
  97  | 
  98  |     // Validar botón de exportación MusicXML
  99  |     await expect(page.getByRole('button', { name: /Descargar MusicXML/i })).toBeVisible();
  100 |   });
  101 | 
  102 |   // ─── CONTROL 4: HERRAMIENTA DE ANÁLISIS 6D Y RAG ─────────────────
  103 |   test('Control 4: Herramienta de Análisis debe renderizar el radar 6D e ingesta de archivos', async ({ page }) => {
  104 |     await page.goto(`${BASE_URL}/analyze`);
  105 | 
  106 |     // Validar cabecera de Análisis RAG
  107 |     await expect(page.getByRole('heading', { name: /Herramienta de Análisis 6D y RAG/i })).toBeVisible();
  108 | 
  109 |     // Validar presencia del panel de ingesta de partituras/audio
  110 |     await expect(page.getByText(/Ingesta de Audio y Partituras/i)).toBeVisible();
  111 |     await expect(page.getByText(/Haz clic para seleccionar un archivo/i)).toBeVisible();
  112 |   });
  113 | 
  114 |   // ─── CONTROL 5: AUTENTICACIÓN Y REDIRECCIONES ─────────────────────
  115 |   test.describe('Auth Integration: PrivateRoute redirect to /login', () => {
  116 |     test('Acceso a /hybridize sin JWT debe redirigir a /login', async ({ page, context }) => {
  117 |       // Limpiar storage para garantizar sesión limpia
  118 |       await context.clearCookies();
  119 |       await context.addInitScript(() => localStorage.clear());
  120 | 
  121 |       await page.goto(`${BASE_URL}/hybridize`);
  122 | 
  123 |       // PrivateRoute debe redirigir a /login
  124 |       await page.waitForURL(/\/login$/, { timeout: 5000 });
  125 |       expect(page.url()).toMatch(/\/login$/);
  126 |     });
  127 | 
  128 |     test('Acceso a /analyze sin JWT debe redirigir a /login', async ({ page, context }) => {
  129 |       await context.clearCookies();
  130 |       await context.addInitScript(() => localStorage.clear());
  131 | 
  132 |       await page.goto(`${BASE_URL}/analyze`);
  133 | 
  134 |       await page.waitForURL(/\/login$/, { timeout: 5000 });
  135 |       expect(page.url()).toMatch(/\/login$/);
  136 |     });
  137 | 
  138 |     test('Acceso a /generate sin JWT debe redirigir a /login', async ({ page, context }) => {
  139 |       await context.clearCookies();
  140 |       await context.addInitScript(() => localStorage.clear());
  141 | 
  142 |       await page.goto(`${BASE_URL}/generate`);
  143 | 
  144 |       await page.waitForURL(/\/login$/, { timeout: 5000 });
  145 |       expect(page.url()).toMatch(/\/login$/);
  146 |     });
  147 | 
  148 |     test('Acceso a /catalog sin JWT también redirige a /login (ruta protegida)', async ({ page, context }) => {
  149 |       await context.clearCookies();
  150 |       await context.addInitScript(() => localStorage.clear());
  151 | 
  152 |       await page.goto(`${BASE_URL}/catalog`);
  153 | 
  154 |       // /catalog está bajo PrivateRoute: debe redirigir a /login
  155 |       await page.waitForURL(/\/login$/, { timeout: 5000 });
  156 |       expect(page.url()).toMatch(/\/login$/);
  157 |     });
  158 | 
  159 |     test('Acceso a / con sesión válida debe permanecer en la app', async ({ page }) => {
  160 |       // beforeEach ya hace login via API y setea localStorage
  161 |       // Primero navegamos a una ruta que monta el AuthProvider y carga user
  162 |       await page.goto(`${BASE_URL}/catalog`);
  163 |       // Luego verificamos que el Layout muestra el email (Header global)
  164 |       await expect(page.getByText(/admin@uoam\.com/i)).toBeVisible({ timeout: 10000 });
  165 |       // Y que la URL no fue redirigida a /login
  166 |       expect(page.url()).toMatch(/\/catalog$/);
  167 |     });
  168 |   });
  169 | });
  170 | 
```
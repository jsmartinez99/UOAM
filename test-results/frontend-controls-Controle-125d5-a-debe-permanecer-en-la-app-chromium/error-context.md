# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: frontend-controls.spec.ts >> Controles Automatizados E2E del Frontend UOAM >> Auth Integration: PrivateRoute redirect to /login >> Acceso a / con sesión válida debe permanecer en la app
- Location: tests/e2e/frontend-controls.spec.ts:159:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/admin@uoam\.com/i)
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText(/admin@uoam\.com/i)

```

```yaml
- banner:
  - heading "UOAM Arranger" [level=6]
  - button "Entrar"
- main:
  - heading "Iniciar Sesión" [level=2]
  - paragraph: Accede al Catálogo de Arreglos y Herramientas del Sistema
  - text: Correo electrónico
  - textbox "Correo electrónico"
  - text: Contraseña
  - textbox "Contraseña"
  - button "Iniciar Sesión"
  - paragraph: "Credenciales de demo predeterminadas:"
  - button "Entrar como Demo Admin (1-Clic)"
```

# Test source

```ts
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
  91  |     await expect(page.getByText(/Clímax/i)).toBeVisible();
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
> 164 |       await expect(page.getByText(/admin@uoam\.com/i)).toBeVisible({ timeout: 10000 });
      |                                                        ^ Error: expect(locator).toBeVisible() failed
  165 |       // Y que la URL no fue redirigida a /login
  166 |       expect(page.url()).toMatch(/\/catalog$/);
  167 |     });
  168 |   });
  169 | });
  170 | 
```
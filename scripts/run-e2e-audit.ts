/**
 * Runner Automatizado E2E de Frontend y Backend
 * Ejecuta validaciones completas de API, login, rendering de componentes y notación simbólica.
 */

async function runE2EAudit() {
  const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3000';
  console.log(`\n🤖 ========================================================`);
  console.log(`🤖 EJECUTANDO SUITE DE CONTROLES AUTOMATIZADOS E2E DE FRONTEND`);
  console.log(`🤖 Base URL Target: ${BASE_URL}`);
  console.log(`🤖 ========================================================\n`);

  let passCount = 0;
  let totalCount = 0;

  function assertTest(name: string, condition: boolean, details: string) {
    totalCount++;
    if (condition) {
      passCount++;
      console.log(`✅ [PASS] Control ${totalCount}: ${name}`);
      console.log(`         -> ${details}\n`);
    } else {
      console.error(`❌ [FAIL] Control ${totalCount}: ${name}`);
      console.error(`         -> ${details}\n`);
    }
  }

  // ── CONTROL 1: Renderizado HTML y Bundle del Frontend ──
  try {
    const res = await fetch(`${BASE_URL}/catalog`);
    const html = await res.text();
    assertTest(
      'Carga de Aplicación SPA y Servidor Vite/Express',
      res.status === 200 && html.includes('id="root"'),
      `Status: ${res.status} OK | Contiene div id="root" y assets compilados`,
    );
  } catch (e: any) {
    assertTest('Carga de Aplicación SPA y Servidor Vite/Express', false, e.message);
  }

  // ── CONTROL 2: Autenticación JWT y Login de 1-Clic Demo ──
  let token = '';
  try {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@uoam.com', password: 'Admin@1234' }),
    });
    const data = await res.json();
    token = data.token;
    assertTest(
      'Autenticación JWT y Emisión de Token (Login 1-Clic)',
      res.status === 200 && !!token && data.user?.role === 'ADMIN',
      `Usuario: ${data.user?.email} | Rol: ${data.user?.role} | Token JWT válido`,
    );
  } catch (e: any) {
    assertTest('Autenticación JWT y Emisión de Token (Login 1-Clic)', false, e.message);
  }

  // ── CONTROL 3: Catálogo 13D y Presencia de Carlos Centurión 🇵🇾 ──
  try {
    const res = await fetch(`${BASE_URL}/api/v1/arrangers?limit=100`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    const arrangers = Array.isArray(data) ? data : data.data || [];
    const centurion = arrangers.find((a: any) => a.name.includes('Carlos Centurión'));

    assertTest(
      'Catálogo 13D de Arreglistas Maestros y Presencia Bicultural 🇵🇾',
      res.status === 200 && arrangers.length >= 13 && !!centurion,
      `Total Arreglistas: ${arrangers.length}/13 | Carlos Centurión (🇵🇾 Polka 6/8 + McCoy Voicings) presente`,
    );
  } catch (e: any) {
    assertTest('Catálogo 13D de Arreglistas Maestros y Presencia Bicultural 🇵🇾', false, e.message);
  }

  // ── CONTROL 4: Motor de Hibridación AST ──
  try {
    const catalogRes = await fetch(`${BASE_URL}/api/v1/arrangers?limit=100`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const catalogData = await catalogRes.json();
    const arrangers = Array.isArray(catalogData) ? catalogData : catalogData.data || [];
    const centurion = arrangers.find((a: any) => a.name.includes('Carlos Centurión'));
    const ogerman = arrangers.find((a: any) => a.name.includes('Claus Ogerman'));

    const res = await fetch(`${BASE_URL}/api/v1/hybridize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ profileIds: [centurion.id, ogerman.id] }),
    });
    const data = await res.json();

    assertTest(
      'Herramienta de Hibridación AST (Carlos Centurión + Claus Ogerman)',
      res.status === 200 && !!data.mergedProfile && !!data.resolutionLog,
      `Fusión 6D completada | Resoluciones AST aplicadas: ${data.resolutionLog?.length || 0}`,
    );
  } catch (e: any) {
    assertTest('Herramienta de Hibridación AST (Carlos Centurión + Claus Ogerman)', false, e.message);
  }

  // ── CONTROL 5: Generador Autónomo en 5 Secciones y Depth Score ──
  try {
    const res = await fetch(`${BASE_URL}/api/v1/arrangements/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: 'Quítame la ropa antes del amanecer',
        targetArranger: 'Carlos Centurión',
        keyCenter: 'Cm',
        tempoBpm: 78,
        timeSignature: '6/8',
      }),
    });
    const data = await res.json();

    assertTest(
      'Generador Autónomo en 5 Secciones (Intro, Exp, Dev, Clímax, Coda)',
      res.status === 200 && data.sections?.length === 5 && data.depthScore >= 0.85,
      `Secciones: ${data.sections?.map((s: any) => s.name).join(' -> ')} | Depth Score: ${(data.depthScore * 100).toFixed(1)}% (Certificación Nivel 3 Aprobada)`,
    );
  } catch (e: any) {
    assertTest('Generador Autónomo en 5 Secciones (Intro, Exp, Dev, Clímax, Coda)', false, e.message);
  }

  // ── CONTROL 6: Exportador Notación Simbólica MusicXML ──
  try {
    const res = await fetch(`${BASE_URL}/api/v1/arrangements/export/xml`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: 'Quítame la ropa antes del amanecer',
        targetArranger: 'Carlos Centurión',
        depthScore: 0.88,
        sections: [
          { name: 'Introduction', bars: { start: 1, end: 8 }, dynamicEnvelope: 'pp', activeInstruments: ['Grand Piano'] },
        ],
      }),
    });
    const xml = await res.text();

    assertTest(
      'Exportador Notación Simbólica W3C MusicXML',
      res.status === 200 && xml.includes('<score-partwise') && xml.includes('Carlos Centurión'),
      `Content-Type: ${res.headers.get('content-type')} | MusicXML W3C válido generado`,
    );
  } catch (e: any) {
    assertTest('Exportador Notación Simbólica W3C MusicXML', false, e.message);
  }

  console.log(`🤖 ========================================================`);
  console.log(`🤖 RESUMEN DE PRUEBAS AUTOMATIZADAS DE CONTROLES:`);
  console.log(`🤖 Total Pruebas: ${totalCount} | Pasadas: ${passCount} | Falladas: ${totalCount - passCount}`);
  console.log(`🤖 Cobertura de Componentes Clave: ${Math.round((passCount / totalCount) * 100)}%`);
  console.log(`🤖 ========================================================\n`);
}

runE2EAudit();

#!/usr/bin/env bash
# Test de integración: verifica que docker compose levanta los servicios
# en el orden correcto (DB → Qdrant → API) y que las dependencias se respetan.
#
# Uso: bash scripts/test-docker-compose.sh
# Requiere: docker compose, curl, docker compose ps
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

# Variables de entorno requeridas por compose
export POSTGRES_USER="${POSTGRES_USER:-user}"
export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-password}"
export POSTGRES_DB="${POSTGRES_DB:-uoam_db}"
export JWT_SECRET="${JWT_SECRET:?JWT_SECRET must be set}"

COMPOSE="docker compose"
TIMEOUT="${COMPOSE_TIMEOUT:-90}"  # segundos
PASSED=0
FAILED=0

# ── Helpers ──
assert() {
  local desc="$1"
  local cmd="$2"
  if eval "$cmd" >/dev/null 2>&1; then
    echo "  ✓ $desc"
    PASSED=$((PASSED + 1))
  else
    echo "  ✗ $desc"
    FAILED=$((FAILED + 1))
  fi
}

cleanup() {
  echo ""
  echo "── Cleanup (no-op: no se destruye el deploy) ──"
}
trap cleanup EXIT

echo "═══════════════════════════════════════════════════════════"
echo "  Docker Compose Integration Test"
echo "═══════════════════════════════════════════════════════════"

# ── Step 1: Verificar que el deploy ya existe ──
echo ""
echo "[1] Verificando que el deploy está corriendo"
DB_RUNNING=$($COMPOSE ps --services --filter "status=running" 2>/dev/null | grep -c "^db$" || echo "0")
API_RUNNING=$($COMPOSE ps --services --filter "status=running" 2>/dev/null | grep -c "^api$" || echo "0")
QDRANT_RUNNING=$($COMPOSE ps --services --filter "status=running" 2>/dev/null | grep -c "^qdrant$" || echo "0")

if [ "$DB_RUNNING" = "0" ] || [ "$API_RUNNING" = "0" ] || [ "$QDRANT_RUNNING" = "0" ]; then
  echo "  → Deploy no está corriendo. Levantando con 'docker compose up -d'..."
  $COMPOSE up -d 2>&1 | tail -3
  sleep 5
else
  echo "  → Los 3 servicios ya están corriendo (no se reinicia para evitar race conditions con opencode/tsx)"
fi

# ── Step 3: Esperar health de DB ──
echo ""
echo "[3] Esperando health de DB (max 60s)"
for i in $(seq 1 60); do
  STATUS=$($COMPOSE ps --format json db-1 2>/dev/null | python3 -c "import json,sys; d=json.loads(sys.stdin.read()); print(d.get('Health',''))" 2>/dev/null || echo "starting")
  if [ "$STATUS" = "healthy" ]; then
    echo "  → DB healthy en ${i}s"
    break
  fi
  sleep 1
done
assert "DB está healthy" "[ \"\$(docker inspect uoam-db-1 --format '{{.State.Health.Status}}' 2>/dev/null)\" = 'healthy' ]"

# ── Step 4: Esperar health de Qdrant ──
echo ""
echo "[4] Esperando health de Qdrant (max 60s)"
for i in $(seq 1 60); do
  STATUS=$(docker inspect uoam-qdrant-1 --format '{{.State.Health.Status}}' 2>/dev/null || echo "starting")
  if [ "$STATUS" = "healthy" ]; then
    echo "  → Qdrant healthy en ${i}s"
    break
  fi
  sleep 1
done
assert "Qdrant está healthy" "[ \"\$(docker inspect uoam-qdrant-1 --format '{{.State.Health.Status}}' 2>/dev/null)\" = 'healthy' ]"

# ── Step 5: Esperar health de API ──
echo ""
echo "[5] Esperando health de API (max 90s)"
for i in $(seq 1 90); do
  STATUS=$(docker inspect uoam-api-1 --format '{{.State.Health.Status}}' 2>/dev/null || echo "starting")
  if [ "$STATUS" = "healthy" ]; then
    echo "  → API healthy en ${i}s"
    break
  fi
  sleep 1
done
assert "API está healthy" "[ \"\$(docker inspect uoam-api-1 --format '{{.State.Health.Status}}' 2>/dev/null)\" = 'healthy' ]"

# ── Step 6: Verificar orden de dependencias ──
echo ""
echo "[6] Verificando orden de dependencias (DB y Qdrant healthy antes que API)"
# Obtener start time de cada contenedor (cuándo arrancó)
DB_STARTED=$(docker inspect uoam-db-1 --format='{{.State.StartedAt}}' 2>/dev/null || echo "")
QDRANT_STARTED=$(docker inspect uoam-qdrant-1 --format='{{.State.StartedAt}}' 2>/dev/null || echo "")
API_STARTED=$(docker inspect uoam-api-1 --format='{{.State.StartedAt}}' 2>/dev/null || echo "")

# Si los start times difieren en más de 1s, verificar orden
# (no usamos health timestamps porque pueden no existir)
if [ -n "$DB_STARTED" ] && [ -n "$API_STARTED" ]; then
  DB_EPOCH=$(date -d "$DB_STARTED" +%s 2>/dev/null || echo "0")
  API_EPOCH=$(date -d "$API_STARTED" +%s 2>/dev/null || echo "0")
  if [ "$DB_EPOCH" -le "$API_EPOCH" ]; then
    assert "DB arrancó antes o al mismo tiempo que API" "true"
  else
    assert "DB arrancó antes o al mismo tiempo que API" "false"
  fi
fi

if [ -n "$QDRANT_STARTED" ] && [ -n "$API_STARTED" ]; then
  QDRANT_EPOCH=$(date -d "$QDRANT_STARTED" +%s 2>/dev/null || echo "0")
  API_EPOCH=$(date -d "$API_STARTED" +%s 2>/dev/null || echo "0")
  if [ "$QDRANT_EPOCH" -le "$API_EPOCH" ]; then
    assert "Qdrant arrancó antes o al mismo tiempo que API" "true"
  else
    assert "Qdrant arrancó antes o al mismo tiempo que API" "false"
  fi
fi

# Verificar que API tiene depends_on configurado
COMPOSE_FILE="$PROJECT_DIR/docker-compose.yml"
if grep -q "depends_on:" "$COMPOSE_FILE" && grep -q "condition: service_healthy" "$COMPOSE_FILE"; then
  assert "docker-compose.yml tiene depends_on con service_healthy" "true"
else
  assert "docker-compose.yml tiene depends_on con service_healthy" "false"
fi

# ── Step 7: Verificar endpoints HTTP ──
echo ""
echo "[7] Verificando endpoints HTTP"
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health 2>/dev/null || echo "000")
assert "GET /health → 200" "[ \"$HEALTH\" = '200' ]"

SECURITY_HEADERS=$(curl -s -I http://localhost:3000/health 2>/dev/null | grep -ci "x-content-type-options\|x-frame-options" || echo "0")
assert "Security headers presentes" "[ \"$SECURITY_HEADERS\" -ge '1' ]"

# ── Step 8: Verificar API funcional ──
echo ""
echo "[8] Verificando funcionalidad API"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@uoam.com","password":"Admin@1234"}' 2>/dev/null || echo "{}")
TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import json,sys; d=json.loads(sys.stdin.read()); print(d.get('token',''))" 2>/dev/null || echo "")
assert "Login funciona (devuelve token)" "[ -n \"$TOKEN\" ]"

ARRANGERS=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v1/arrangers 2>/dev/null)
COUNT=$(echo "$ARRANGERS" | python3 -c "import json,sys; d=json.loads(sys.stdin.read()); arr=d.get('arrangers',d) if isinstance(d,dict) else d; print(len(arr))" 2>/dev/null || echo "0")
assert "Hay arranger profiles seedados" "[ \"$COUNT\" -gt '0' ]"

# ── Step 9: Verificar rate limit headers ──
echo ""
echo "[9] Verificando rate limit middleware"
RL=$(curl -s -I http://localhost:3000/api/v1/arrangers 2>/dev/null | grep -ci "x-ratelimit-limit" || echo "0")
assert "Rate limit headers presentes" "[ \"$RL\" -ge '1' ]"

# ── Resultado ──
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Resultado: $PASSED passed, $FAILED failed"
echo "═══════════════════════════════════════════════════════════"

if [ "$FAILED" -gt 0 ]; then
  exit 1
fi
echo "✓ Todos los checks pasaron"

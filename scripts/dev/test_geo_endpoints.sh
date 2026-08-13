#!/usr/bin/env bash
# FloodGuard — testa os endpoints geo (e /health) contra uma API rodando.
#
# Uso:
#   scripts/dev/test_geo_endpoints.sh [base_url]
#
# base_url default: http://localhost:8000. Os endpoints geo vivem sob
# /api/geo (não /geo) — ver services/api/app/routers/geo.py.
set -uo pipefail

BASE_URL="${1:-http://localhost:8000}"

check() {
  local label="$1"
  local path="$2"
  echo "=== $label — GET $path ==="
  local status
  status=$(curl -s -o /tmp/floodguard_test_response.json -w "%{http_code}" "$BASE_URL$path")
  echo "status: $status"
  if command -v jq >/dev/null 2>&1; then
    jq . /tmp/floodguard_test_response.json 2>/dev/null || cat /tmp/floodguard_test_response.json
  else
    cat /tmp/floodguard_test_response.json
  fi
  echo
}

check "health"                  "/health"
check "geo status"              "/api/geo/status"
check "municipio Blumenau"      "/api/geo/municipality/blumenau"
check "bacias Blumenau"         "/api/geo/basins/blumenau"
check "zonas HAND"              "/api/geo/hand-zones"
check "resumo zonas HAND"       "/api/geo/hand-zones/summary"
check "contexto espacial (ponto)" "/api/geo/point-risk-context?lat=-26.918&lon=-49.066"

rm -f /tmp/floodguard_test_response.json

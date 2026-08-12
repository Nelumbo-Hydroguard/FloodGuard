#!/usr/bin/env bash
# FloodGuard — roda export_to_postgis.py export-all usando o venv de services/geo.
#
# Uso:
#   export DATABASE_URL="postgresql+psycopg://floodguard:floodguard@localhost:5432/floodguard"
#   scripts/dev/run_export.sh
#
# Cria o venv na primeira vez, se ainda não existir (services/geo/.venv,
# ignorado pelo git). Depois disso só reaproveita.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
GEO_DIR="$REPO_ROOT/services/geo"
VENV="$GEO_DIR/.venv"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL não definido. Copie .env.example para .env e exporte a variável." >&2
  exit 1
fi

if [ ! -x "$VENV/bin/python" ]; then
  echo "Criando venv em $VENV ..."
  python3 -m venv "$VENV"
  "$VENV/bin/pip" install --quiet geopandas rasterio shapely pyproj sqlalchemy geoalchemy2 "psycopg[binary]"
fi

"$VENV/bin/python" "$GEO_DIR/scripts/export_to_postgis.py" inspect
"$VENV/bin/python" "$GEO_DIR/scripts/export_to_postgis.py" export-all

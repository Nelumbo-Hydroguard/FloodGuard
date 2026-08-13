#!/usr/bin/env bash
# FloodGuard — aplica db/migrations/*.sql em ordem contra DATABASE_URL.
#
# Uso:
#   export DATABASE_URL="postgresql+psycopg://floodguard:floodguard@localhost:5432/floodguard"
#   scripts/dev/apply_migrations.sh
#
# psql não entende o prefixo "+psycopg" do SQLAlchemy — este script aceita a
# mesma DATABASE_URL do .env e normaliza antes de chamar psql.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL não definido. Copie .env.example para .env e exporte a variável." >&2
  exit 1
fi

PSQL_URL="${DATABASE_URL/postgresql+psycopg:/postgresql:}"

for migration in "$REPO_ROOT"/db/migrations/*.sql; do
  echo "=== Aplicando $(basename "$migration") ==="
  psql "$PSQL_URL" -v ON_ERROR_STOP=1 -f "$migration"
done

echo "Migrations aplicadas com sucesso."

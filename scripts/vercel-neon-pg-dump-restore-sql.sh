#!/usr/bin/env bash
# Plain-SQL path: pg_dump → backup.sql → psql (same as manual two-liner).
# Run from repo root: pnpm run db:migrate:neon-vercel:sql
# Artifacts under .neon-migrate/ (gitignored).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
NEON_DIR="$REPO_ROOT/.neon-migrate"
mkdir -p "$NEON_DIR"

: "${NEON_MIGRATE_SOURCE_URL:?Set NEON_MIGRATE_SOURCE_URL (old DB, direct/unpooled preferred)}"
: "${NEON_MIGRATE_TARGET_URL:?Set NEON_MIGRATE_TARGET_URL (new empty DB, direct/unpooled)}"

SQL_FILE="${NEON_MIGRATE_SQL_FILE:-$NEON_DIR/backup.sql}"

for cmd in pg_dump psql; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "error: missing '$cmd'. Install PostgreSQL client tools (e.g. brew install libpq)." >&2
    exit 1
  fi
done

echo "[neon-migrate] Repo root: $REPO_ROOT"
echo "[neon-migrate] pg_dump → $SQL_FILE"
# --no-publications skips Neon replication objects (e.g. neon_pub) that fail on restore; needs pg_dump 15+.
if [[ "${NEON_MIGRATE_VERBOSE:-}" == "1" ]]; then
  pg_dump --no-owner --no-acl --no-publications "$NEON_MIGRATE_SOURCE_URL" -f "$SQL_FILE" -v
else
  pg_dump --no-owner --no-acl --no-publications "$NEON_MIGRATE_SOURCE_URL" -f "$SQL_FILE"
fi

echo "[neon-migrate] psql restore from $SQL_FILE"
psql "$NEON_MIGRATE_TARGET_URL" -v ON_ERROR_STOP=1 -f "$SQL_FILE"

if [[ "${NEON_MIGRATE_KEEP_SQL:-}" == "1" ]]; then
  echo "[neon-migrate] Kept SQL file: $SQL_FILE"
else
  rm -f "$SQL_FILE"
  echo "[neon-migrate] Removed $SQL_FILE (set NEON_MIGRATE_KEEP_SQL=1 to keep)."
fi

echo "[neon-migrate] Done. Verify admin + data, then point Vercel DATABASE_URL at new pooled URL and redeploy."

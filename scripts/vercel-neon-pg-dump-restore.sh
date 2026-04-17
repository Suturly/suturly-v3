#!/usr/bin/env bash
# Dump current Neon (or any Postgres) and restore into Vercel-Managed Neon target.
# Requires: pg_dump, pg_restore (PostgreSQL client).
# Run from repo root: pnpm run db:migrate:neon-vercel
# Artifacts go under .neon-migrate/ (gitignored). See docs/vercelManagedNeonMigration.md

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
NEON_DIR="$REPO_ROOT/.neon-migrate"
mkdir -p "$NEON_DIR"

: "${NEON_MIGRATE_SOURCE_URL:?Set NEON_MIGRATE_SOURCE_URL to the source DB URI (prefer direct/unpooled)}"
: "${NEON_MIGRATE_TARGET_URL:?Set NEON_MIGRATE_TARGET_URL to an empty target DB URI (prefer direct/unpooled)}"

for cmd in pg_dump pg_restore; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "error: missing '$cmd'. Install PostgreSQL client tools (e.g. brew install libpq)." >&2
    exit 1
  fi
done

DUMP_FILE="${NEON_MIGRATE_DUMP_FILE:-$NEON_DIR/backup.dump}"

echo "[neon-migrate] Repo root: $REPO_ROOT"
echo "[neon-migrate] Dumping from source → $DUMP_FILE"
# --no-publications: avoid Neon publication ownership errors on target; needs pg_dump 15+.
if [[ "${NEON_MIGRATE_VERBOSE:-}" == "1" ]]; then
  pg_dump --no-publications "$NEON_MIGRATE_SOURCE_URL" -Fc -f "$DUMP_FILE" -v
else
  pg_dump --no-publications "$NEON_MIGRATE_SOURCE_URL" -Fc -f "$DUMP_FILE"
fi

echo "[neon-migrate] Restoring into target (no-owner / no-acl)"
if [[ "${NEON_MIGRATE_VERBOSE:-}" == "1" ]]; then
  pg_restore --no-owner --no-acl -d "$NEON_MIGRATE_TARGET_URL" -v "$DUMP_FILE"
else
  pg_restore --no-owner --no-acl -d "$NEON_MIGRATE_TARGET_URL" "$DUMP_FILE"
fi

if [[ "${NEON_MIGRATE_KEEP_DUMP:-}" == "1" ]]; then
  echo "[neon-migrate] Kept dump file: $DUMP_FILE"
else
  rm -f "$DUMP_FILE"
  echo "[neon-migrate] Removed $DUMP_FILE (set NEON_MIGRATE_KEEP_DUMP=1 to keep)."
fi

echo "[neon-migrate] Done. Verify admin + data, then point Vercel production DATABASE_URL at the target and redeploy."

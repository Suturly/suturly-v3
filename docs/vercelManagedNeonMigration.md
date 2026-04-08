# Vercel-Managed Neon (Path B): migrate an existing database without data loss

This project uses Payload with [`@payloadcms/db-postgres`](https://payloadcms.com/docs/database/postgres) and **`DATABASE_URL`**. Vercel’s **Neon Postgres (Vercel-Managed / “native”)** integration injects the same variable; you do **not** need to change `payload.config.ts` for connectivity after cutover.

What **must** happen outside this repo:

1. Install the integration from the [Vercel Marketplace (Neon)](https://vercel.com/marketplace/neon) and create or attach a database (**billing on Vercel**).
2. Connect your Vercel project so **Production / Preview / Development** get `DATABASE_URL` (and related vars) as described in [Neon: Vercel-Managed Integration](https://neon.com/docs/guides/vercel-managed-integration).

What this document covers: **copying all data** from your **old** Neon project into the **new** empty database that Vercel-Managed Neon created, then **cutting over** production.

## Before you start

- **Short maintenance window:** Stop writes to the old database during the dump (disable admin, maintenance page, or scale app to zero) so the backup is internally consistent.
- **Target database must be empty:** Use a freshly created Neon database/branch for the Vercel-Managed project. Do not run restore twice into a DB that already has Payload tables unless you know how to reset it.
- **Prefer “direct” (unpooled) URLs** for `pg_dump` / `pg_restore`. Neon documents pooled vs unpooled strings; poolers can interfere with long-running restore sessions.
- **Keep the old Neon project** (read-only) until production has been verified; only then decommission it.
- **Media:** If production uses Cloudflare R2 for uploads, files are **not** in Postgres—only rows (URLs, filenames, metadata) move with this migration.

## One-command copy (local machine)

**Always run from the repo root** (`suturly-v3/`). Artifacts go under **`.neon-migrate/`** (in `.gitignore` — full DB copies, never commit).

Requires PostgreSQL client tools (e.g. `brew install libpq` on macOS; ensure `pg_dump` / `pg_restore` / `psql` on `PATH`).

### Custom format: `pg_dump -Fc` + `pg_restore`

```bash
cd /path/to/suturly-v3

export NEON_MIGRATE_SOURCE_URL='postgresql://...'   # old Neon (direct/unpooled URI)
export NEON_MIGRATE_TARGET_URL='postgresql://...'   # new Vercel-Managed Neon (direct, empty DB)

pnpm run db:migrate:neon-vercel
```

Uses **`.neon-migrate/backup.dump`**. Removed on success unless `NEON_MIGRATE_KEEP_DUMP=1`.

### Plain SQL: `pg_dump` + `psql`

```bash
cd /path/to/suturly-v3

export NEON_MIGRATE_SOURCE_URL='postgresql://...'
export NEON_MIGRATE_TARGET_URL='postgresql://...'

pnpm run db:migrate:neon-vercel:sql
```

Uses **`.neon-migrate/backup.sql`**. Removed on success unless `NEON_MIGRATE_KEEP_SQL=1`.

### Optional (both flows)

- `NEON_MIGRATE_VERBOSE=1` — verbose output.
- `NEON_MIGRATE_DUMP_FILE` / `NEON_MIGRATE_SQL_FILE` — override file path.

Run scripts directly if you prefer: `bash scripts/vercel-neon-pg-dump-restore.sh` / `bash scripts/vercel-neon-pg-dump-restore-sql.sh`.

## Manual commands (same as custom-format script)

From repo root:

```bash
pg_dump "$NEON_MIGRATE_SOURCE_URL" -Fc -f .neon-migrate/backup.dump
pg_restore --no-owner --no-acl -d "$NEON_MIGRATE_TARGET_URL" .neon-migrate/backup.dump
```

If `pg_restore` errors on duplicate objects, the target was not empty—create a fresh database/branch and retry.

## After restore

1. **Verify:** Connect with `psql` or open a **staging** deployment whose `DATABASE_URL` points at the new cluster; log into `/admin` and spot-check collections.
2. **Cut over production:** Ensure Vercel **Production** uses the integration-managed `DATABASE_URL` for the new database (disconnect any manual override that still points at the old cluster). Redeploy.
3. **Payload:** No schema rebuild is needed if you restored a **full** copy of the same Payload database; migration history tables (if any) come across with the dump.
4. **Preview deployments:** If you enable **preview branching**, new preview DBs start empty unless you add a build-step migration/seed—plan separately from production cutover.

## Troubleshooting

- **“Failed to set environment variables”** during Neon integration: remove conflicting `DATABASE_URL` / `PG*` variables in Vercel, then reconnect ([Neon troubleshooting](https://neon.com/docs/guides/neon-managed-vercel-integration#troubleshooting)).
- **`neon auth` / CLI issues** on Vercel-Managed orgs: see [limitations](https://neon.com/docs/guides/vercel-managed-integration#limitations); use connection strings from the Vercel Storage UI or Neon Console (“Open in Neon”).

## Related

- [CMS / environment switching](cms-environment-guide.md) — `pnpm run env:use:production` / `env:use:development`
- Neon: [connection methods from Vercel](https://neon.com/docs/guides/vercel-connection-methods)

import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Snapshot-only correction: the previous migration's snapshot was generated
 * while the @payloadcms/plugin-nested-docs-injected `breadcrumbs` field on
 * Categories was still localized: true (the plugin hardcodes that in 3.84.x).
 * We have since pre-defined `breadcrumbs` in src/collections/Categories.ts
 * with `localized: false` to stop the plugin from injecting its own version,
 * because Categories aren't part of the EN/ES localization scope.
 *
 * The auto-generated migration body wants to drop a `_locale` column and its
 * index from `categories_breadcrumbs`, but neither was ever added to the live
 * DB (we caught the issue before any schema push completed). The DROPs use
 * `IF EXISTS` so the migration is a no-op against the real DB while still
 * advancing the snapshot to the correct state.
 */
export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "categories_breadcrumbs_locale_idx";
    ALTER TABLE "categories_breadcrumbs" DROP COLUMN IF EXISTS "_locale";
  `)
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "categories_breadcrumbs" ADD COLUMN IF NOT EXISTS "_locale" "_locales" NOT NULL;
    CREATE INDEX IF NOT EXISTS "categories_breadcrumbs_locale_idx" ON "categories_breadcrumbs" USING btree ("_locale");
  `)
}

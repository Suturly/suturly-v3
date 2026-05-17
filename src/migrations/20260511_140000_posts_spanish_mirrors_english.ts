import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Adds `spanishMirrorsEnglish` (posts.spanish_mirrors_english): when true, EN saves
 * mirror localized fields into ES until editors disable it or Spanish diverges.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "spanish_mirrors_english" boolean DEFAULT true NOT NULL;
    ALTER TABLE "_posts_v" ADD COLUMN IF NOT EXISTS "version_spanish_mirrors_english" boolean DEFAULT true NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "posts" DROP COLUMN IF EXISTS "spanish_mirrors_english";
    ALTER TABLE "_posts_v" DROP COLUMN IF EXISTS "version_spanish_mirrors_english";
  `)
}

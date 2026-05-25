import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Per-field EN→ES mirror paths after document-level detach (Reset to English).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "en_mirrored_field_paths" jsonb DEFAULT '[]'::jsonb NOT NULL;
    ALTER TABLE "_posts_v" ADD COLUMN IF NOT EXISTS "version_en_mirrored_field_paths" jsonb DEFAULT '[]'::jsonb NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "posts" DROP COLUMN IF EXISTS "en_mirrored_field_paths";
    ALTER TABLE "_posts_v" DROP COLUMN IF EXISTS "version_en_mirrored_field_paths";
  `)
}

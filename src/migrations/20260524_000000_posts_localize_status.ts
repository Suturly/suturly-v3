import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Per-locale publish status for Resources (`posts`).
 *
 * Payload's built-in `localizeStatus.up()` calls `db.execute({ drizzle, sql })` in a way that
 * fails with `@payloadcms/db-postgres` (`query.getSQL is not a function`). This hand-written
 * migration mirrors the SCENARIO-2 path for an existing `_posts_v_locales` / `posts_locales`:
 * copy document-level status to every locale row, then drop the old columns.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  // --- Version history: version__status → _posts_v_locales.version__status ---
  await db.execute(sql`
    ALTER TABLE "_posts_v_locales"
      ADD COLUMN IF NOT EXISTS "version__status" varchar;
  `)

  await db.execute(sql`
    UPDATE "_posts_v_locales" vl
    SET "version__status" = v."version__status"
    FROM "_posts_v" v
    WHERE vl."_parent_id" = v."id"
      AND v."version__status" IS NOT NULL
      AND vl."version__status" IS NULL;
  `)

  await db.execute(sql`
    UPDATE "_posts_v_locales" vl
    SET "version__status" = COALESCE(vl."version__status", 'draft')
    WHERE vl."version__status" IS NULL;
  `)

  await db.execute(sql`
    ALTER TABLE "_posts_v" DROP COLUMN IF EXISTS "version__status";
  `)

  // --- Live documents: _status → posts_locales._status ---
  await db.execute(sql`
    ALTER TABLE "posts_locales"
      ADD COLUMN IF NOT EXISTS "_status" varchar DEFAULT 'draft';
  `)

  // Ensure ES locale rows exist (older migrations only seeded EN for some tables).
  await db.execute(sql`
    INSERT INTO "posts_locales" ("_parent_id", "_locale", "_status")
    SELECT p."id", 'es'::"_locales", COALESCE(p."_status", 'draft')
    FROM "posts" p
    WHERE NOT EXISTS (
      SELECT 1 FROM "posts_locales" pl
      WHERE pl."_parent_id" = p."id" AND pl."_locale" = 'es'::"_locales"
    );
  `)

  await db.execute(sql`
    UPDATE "posts_locales" pl
    SET "_status" = COALESCE(p."_status", 'draft')
    FROM "posts" p
    WHERE pl."_parent_id" = p."id"
      AND p."_status" IS NOT NULL;
  `)

  await db.execute(sql`
    UPDATE "posts_locales" pl
    SET "_status" = COALESCE(pl."_status", 'draft')
    WHERE pl."_status" IS NULL;
  `)

  await db.execute(sql`
    ALTER TABLE "posts" DROP COLUMN IF EXISTS "_status";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "_status" varchar;
  `)

  await db.execute(sql`
    UPDATE "posts" p
    SET "_status" = pl."_status"
    FROM "posts_locales" pl
    WHERE pl."_parent_id" = p."id"
      AND pl."_locale" = 'en'::"_locales";
  `)

  await db.execute(sql`
    UPDATE "posts" p
    SET "_status" = 'draft'
    WHERE p."_status" IS NULL;
  `)

  await db.execute(sql`
    ALTER TABLE "posts_locales" DROP COLUMN IF EXISTS "_status";
  `)

  await db.execute(sql`
    ALTER TABLE "_posts_v" ADD COLUMN IF NOT EXISTS "version__status" varchar;
  `)

  await db.execute(sql`
    UPDATE "_posts_v" v
    SET "version__status" = pl."version__status"
    FROM "_posts_v_locales" pl
    WHERE v."id" = pl."_parent_id"
      AND pl."_locale" = 'en'::"_locales";
  `)

  await db.execute(sql`
    ALTER TABLE "_posts_v_locales" DROP COLUMN IF EXISTS "version__status";
  `)
}

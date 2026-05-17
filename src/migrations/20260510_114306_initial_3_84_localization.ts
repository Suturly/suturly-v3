import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Bridge migration introducing the migrations workflow on top of an existing
 * Payload 3.79.0 database, while:
 *
 *  - upgrading the version snapshot schema to 3.84.x (snapshot jsonb +
 *    published_locale enum on _posts_v / _pages_v),
 *  - enabling EN/ES localization for Resources SEO meta only (move
 *    posts.meta_* and _posts_v.version_meta_* into companion _locales
 *    tables, with data preservation),
 *  - keeping Pages SEO, Forms, and Search un-localized (their schemas don't
 *    change here — see stripLocalization() and plugin overrides in
 *    src/plugins/index.ts).
 *
 * Ordering: we INSERT into the new _locales tables BEFORE dropping the
 * source columns, then create indexes on the _locales tables AFTER the DROP
 * COLUMN auto-removes the old indexes (which share the same names).
 *
 * The companion .json snapshot file represents Drizzle's view of the schema
 * after this migration runs and becomes the baseline for future
 * payload migrate:create diffs.
 */
export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- 1. Locale enums introduced by enabling localization in payload.config.ts.
    CREATE TYPE "public"."_locales" AS ENUM ('en', 'es');
    CREATE TYPE "public"."enum__posts_v_published_locale" AS ENUM ('en', 'es');
    CREATE TYPE "public"."enum__pages_v_published_locale" AS ENUM ('en', 'es');

    -- 2. Companion locale table for posts SEO meta. Constraints attached now;
    --    indexes are deferred to step 6 because they share names with old
    --    indexes on posts.meta_image_id that auto-drop with the column.
    CREATE TABLE "posts_locales" (
      "meta_title" varchar,
      "meta_image_id" integer,
      "meta_description" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );
    ALTER TABLE "posts_locales" ADD CONSTRAINT "posts_locales_meta_image_id_media_id_fk"
      FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    ALTER TABLE "posts_locales" ADD CONSTRAINT "posts_locales_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    -- 3. Preserve existing posts.meta_* into the EN locale row before dropping.
    INSERT INTO "posts_locales" ("_parent_id", "_locale", "meta_title", "meta_image_id", "meta_description")
    SELECT "id", 'en'::"_locales", "meta_title", "meta_image_id", "meta_description"
    FROM "posts"
    WHERE "meta_title" IS NOT NULL OR "meta_image_id" IS NOT NULL OR "meta_description" IS NOT NULL;

    -- 4. Drop the now-redundant flat columns. ALTER TABLE DROP COLUMN auto-drops
    --    indexes/FKs on those columns (posts_meta_meta_image_idx, posts_meta_image_id_media_id_fk).
    ALTER TABLE "posts" DROP COLUMN "meta_title";
    ALTER TABLE "posts" DROP COLUMN "meta_image_id";
    ALTER TABLE "posts" DROP COLUMN "meta_description";

    -- 5. Companion locale table for the post-versions table.
    CREATE TABLE "_posts_v_locales" (
      "version_meta_title" varchar,
      "version_meta_image_id" integer,
      "version_meta_description" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );
    ALTER TABLE "_posts_v_locales" ADD CONSTRAINT "_posts_v_locales_version_meta_image_id_media_id_fk"
      FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    ALTER TABLE "_posts_v_locales" ADD CONSTRAINT "_posts_v_locales_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."_posts_v"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    -- 6. Preserve existing version meta into the EN locale row, then drop the source columns.
    INSERT INTO "_posts_v_locales" ("_parent_id", "_locale", "version_meta_title", "version_meta_image_id", "version_meta_description")
    SELECT "id", 'en'::"_locales", "version_meta_title", "version_meta_image_id", "version_meta_description"
    FROM "_posts_v"
    WHERE "version_meta_title" IS NOT NULL OR "version_meta_image_id" IS NOT NULL OR "version_meta_description" IS NOT NULL;

    ALTER TABLE "_posts_v" DROP COLUMN "version_meta_title";
    ALTER TABLE "_posts_v" DROP COLUMN "version_meta_image_id";
    ALTER TABLE "_posts_v" DROP COLUMN "version_meta_description";

    -- 7. Now that the old same-named indexes are gone, create the new ones on the _locales tables.
    CREATE INDEX "posts_meta_meta_image_idx" ON "posts_locales" USING btree ("meta_image_id","_locale");
    CREATE UNIQUE INDEX "posts_locales_locale_parent_id_unique" ON "posts_locales" USING btree ("_locale","_parent_id");
    CREATE INDEX "_posts_v_version_meta_version_meta_image_idx" ON "_posts_v_locales" USING btree ("version_meta_image_id","_locale");
    CREATE UNIQUE INDEX "_posts_v_locales_locale_parent_id_unique" ON "_posts_v_locales" USING btree ("_locale","_parent_id");

    -- 8. Snapshot + published_locale columns on the version tables. 3.84.x stores
    --    the entire versioned doc as JSON in snapshot and tracks which locale
    --    a draft was last published from in published_locale. Both nullable.
    ALTER TABLE "_posts_v" ADD COLUMN "snapshot" jsonb;
    ALTER TABLE "_posts_v" ADD COLUMN "published_locale" "enum__posts_v_published_locale";
    ALTER TABLE "_pages_v" ADD COLUMN "snapshot" jsonb;
    ALTER TABLE "_pages_v" ADD COLUMN "published_locale" "enum__pages_v_published_locale";
  `)
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Reverse of 8.
    ALTER TABLE "_pages_v" DROP COLUMN IF EXISTS "snapshot";
    ALTER TABLE "_pages_v" DROP COLUMN IF EXISTS "published_locale";
    ALTER TABLE "_posts_v" DROP COLUMN IF EXISTS "snapshot";
    ALTER TABLE "_posts_v" DROP COLUMN IF EXISTS "published_locale";

    -- Reverse of 6 (re-add columns and restore data from _posts_v_locales EN row).
    ALTER TABLE "_posts_v" ADD COLUMN "version_meta_title" varchar;
    ALTER TABLE "_posts_v" ADD COLUMN "version_meta_image_id" integer;
    ALTER TABLE "_posts_v" ADD COLUMN "version_meta_description" varchar;
    UPDATE "_posts_v" v
    SET "version_meta_title" = l."version_meta_title",
        "version_meta_image_id" = l."version_meta_image_id",
        "version_meta_description" = l."version_meta_description"
    FROM "_posts_v_locales" l
    WHERE l."_parent_id" = v."id" AND l."_locale" = 'en';
    ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_meta_image_id_media_id_fk"
      FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

    -- Reverse of 5.
    DROP TABLE IF EXISTS "_posts_v_locales" CASCADE;

    -- Reverse of 4 (re-add columns and restore data from posts_locales EN row).
    ALTER TABLE "posts" ADD COLUMN "meta_title" varchar;
    ALTER TABLE "posts" ADD COLUMN "meta_image_id" integer;
    ALTER TABLE "posts" ADD COLUMN "meta_description" varchar;
    UPDATE "posts" p
    SET "meta_title" = l."meta_title",
        "meta_image_id" = l."meta_image_id",
        "meta_description" = l."meta_description"
    FROM "posts_locales" l
    WHERE l."_parent_id" = p."id" AND l."_locale" = 'en';
    ALTER TABLE "posts" ADD CONSTRAINT "posts_meta_image_id_media_id_fk"
      FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

    -- Reverse of 2.
    DROP TABLE IF EXISTS "posts_locales" CASCADE;

    -- Reverse of 7 (recreate old indexes on the parent tables now that columns are back).
    CREATE INDEX "posts_meta_meta_image_idx" ON "posts" USING btree ("meta_image_id");
    CREATE INDEX "_posts_v_version_meta_version_meta_image_idx" ON "_posts_v" USING btree ("version_meta_image_id");

    -- Reverse of 1.
    DROP TYPE IF EXISTS "public"."enum__pages_v_published_locale";
    DROP TYPE IF EXISTS "public"."enum__posts_v_published_locale";
    DROP TYPE IF EXISTS "public"."_locales";
  `)
}

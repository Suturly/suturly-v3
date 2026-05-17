import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Phase 2 of the EN/ES localization rollout: move every text/textarea/richText
 * field on Resources (the only localized collection) into per-locale storage,
 * and add the translatedAt / enUpdatedAt tracking columns used by Phase 5
 * stale-field detection.
 *
 * Schema moves (with full data preservation into the EN locale):
 *
 *   posts.title, slug, generateSlug, questionsToAskDoctor
 *     -> posts_locales.title, slug, generate_slug, questions_to_ask_doctor
 *   _posts_v.version_title, version_slug, version_generate_slug, version_questions_to_ask_doctor
 *     -> _posts_v_locales.version_*
 *
 *   posts_benefits.title, description
 *     -> NEW posts_benefits_locales.{title, description}
 *   _posts_v_version_benefits.title, description
 *     -> NEW _posts_v_version_benefits_locales.{title, description}
 *
 *   posts_category_sections.content (jsonb)
 *     -> NEW posts_category_sections_locales.content
 *   _posts_v_version_category_sections.content
 *     -> NEW _posts_v_version_category_sections_locales.content
 *
 *   posts_citations.bibliography, url
 *     -> NEW posts_citations_locales.{bibliography, url}
 *   _posts_v_version_citations.bibliography, url
 *     -> NEW _posts_v_version_citations_locales.{bibliography, url}
 *
 * Schema additions (non-localized tracking fields):
 *
 *   posts.translated_at, en_updated_at (timestamp tz, nullable)
 *   _posts_v.version_translated_at, version_en_updated_at (same)
 *
 * Ordering inside the up() block is critical:
 *   1. Add new columns to existing _locales tables (no indexes yet).
 *   2. Create new _locales companion tables with FKs (no indexes yet).
 *   3. INSERT/UPSERT data from parent tables into the _locales rows for 'en'.
 *   4. DROP the parent columns (auto-drops their indexes/uniques).
 *   5. CREATE the new indexes/uniques on the _locales tables.
 *   6. ADD translated_at / en_updated_at columns.
 *
 * The whole migration runs in a single transaction; any failure rolls back.
 */
export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- 1a. Extend posts_locales with the four new top-level localized columns.
    ALTER TABLE "posts_locales" ADD COLUMN "title" varchar;
    ALTER TABLE "posts_locales" ADD COLUMN "slug" varchar;
    ALTER TABLE "posts_locales" ADD COLUMN "generate_slug" boolean;
    ALTER TABLE "posts_locales" ADD COLUMN "questions_to_ask_doctor" jsonb;

    -- 1b. Extend _posts_v_locales with the version_* counterparts.
    ALTER TABLE "_posts_v_locales" ADD COLUMN "version_title" varchar;
    ALTER TABLE "_posts_v_locales" ADD COLUMN "version_slug" varchar;
    ALTER TABLE "_posts_v_locales" ADD COLUMN "version_generate_slug" boolean;
    ALTER TABLE "_posts_v_locales" ADD COLUMN "version_questions_to_ask_doctor" jsonb;

    -- 2a. Companion locale table for posts_benefits array rows.
    --     posts_benefits.id is varchar (UUID), not serial — Payload uses UUIDs for
    --     row ids inside array fields on draft-enabled collections, so the FK column
    --     here must match that type.
    CREATE TABLE "posts_benefits_locales" (
      "title" varchar,
      "description" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" varchar NOT NULL
    );
    ALTER TABLE "posts_benefits_locales" ADD CONSTRAINT "posts_benefits_locales_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."posts_benefits"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    -- 2b. Companion locale table for _posts_v_version_benefits.
    CREATE TABLE "_posts_v_version_benefits_locales" (
      "title" varchar,
      "description" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );
    ALTER TABLE "_posts_v_version_benefits_locales" ADD CONSTRAINT "_posts_v_version_benefits_locales_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."_posts_v_version_benefits"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    -- 2c. Companion locale table for posts_category_sections.
    --     posts_category_sections.id is varchar (UUID).
    CREATE TABLE "posts_category_sections_locales" (
      "content" jsonb,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" varchar NOT NULL
    );
    ALTER TABLE "posts_category_sections_locales" ADD CONSTRAINT "posts_category_sections_locales_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."posts_category_sections"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    -- 2d. Companion locale table for _posts_v_version_category_sections.
    CREATE TABLE "_posts_v_version_category_sections_locales" (
      "content" jsonb,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );
    ALTER TABLE "_posts_v_version_category_sections_locales" ADD CONSTRAINT "_posts_v_version_category_sections_locales_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."_posts_v_version_category_sections"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    -- 2e. Companion locale table for posts_citations (bibliography + url, NOT key).
    --     posts_citations.id is varchar (UUID).
    CREATE TABLE "posts_citations_locales" (
      "bibliography" varchar,
      "url" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" varchar NOT NULL
    );
    ALTER TABLE "posts_citations_locales" ADD CONSTRAINT "posts_citations_locales_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."posts_citations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    -- 2f. Companion locale table for _posts_v_version_citations.
    CREATE TABLE "_posts_v_version_citations_locales" (
      "bibliography" varchar,
      "url" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );
    ALTER TABLE "_posts_v_version_citations_locales" ADD CONSTRAINT "_posts_v_version_citations_locales_parent_id_fk"
      FOREIGN KEY ("_parent_id") REFERENCES "public"."_posts_v_version_citations"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

    -- 3a. Preserve top-level posts.* into posts_locales for 'en'.
    --     UPSERT against the (_locale, _parent_id) unique index — some posts
    --     already have an EN row from the Phase 1.5 SEO migration; others don't.
    INSERT INTO "posts_locales" ("_parent_id", "_locale", "title", "slug", "generate_slug", "questions_to_ask_doctor")
    SELECT "id", 'en'::"_locales", "title", "slug", "generate_slug", "questions_to_ask_doctor"
    FROM "posts"
    ON CONFLICT ("_locale", "_parent_id") DO UPDATE SET
      "title" = EXCLUDED."title",
      "slug" = EXCLUDED."slug",
      "generate_slug" = EXCLUDED."generate_slug",
      "questions_to_ask_doctor" = EXCLUDED."questions_to_ask_doctor";

    -- 3b. Preserve _posts_v.version_* into _posts_v_locales for 'en'.
    INSERT INTO "_posts_v_locales" ("_parent_id", "_locale", "version_title", "version_slug", "version_generate_slug", "version_questions_to_ask_doctor")
    SELECT "id", 'en'::"_locales", "version_title", "version_slug", "version_generate_slug", "version_questions_to_ask_doctor"
    FROM "_posts_v"
    ON CONFLICT ("_locale", "_parent_id") DO UPDATE SET
      "version_title" = EXCLUDED."version_title",
      "version_slug" = EXCLUDED."version_slug",
      "version_generate_slug" = EXCLUDED."version_generate_slug",
      "version_questions_to_ask_doctor" = EXCLUDED."version_questions_to_ask_doctor";

    -- 3c. Preserve posts_benefits inner fields into the new _locales table.
    INSERT INTO "posts_benefits_locales" ("_parent_id", "_locale", "title", "description")
    SELECT "id", 'en'::"_locales", "title", "description"
    FROM "posts_benefits"
    WHERE "title" IS NOT NULL OR "description" IS NOT NULL;

    INSERT INTO "_posts_v_version_benefits_locales" ("_parent_id", "_locale", "title", "description")
    SELECT "id", 'en'::"_locales", "title", "description"
    FROM "_posts_v_version_benefits"
    WHERE "title" IS NOT NULL OR "description" IS NOT NULL;

    -- 3d. Preserve posts_category_sections.content (richText jsonb).
    INSERT INTO "posts_category_sections_locales" ("_parent_id", "_locale", "content")
    SELECT "id", 'en'::"_locales", "content"
    FROM "posts_category_sections"
    WHERE "content" IS NOT NULL;

    INSERT INTO "_posts_v_version_category_sections_locales" ("_parent_id", "_locale", "content")
    SELECT "id", 'en'::"_locales", "content"
    FROM "_posts_v_version_category_sections"
    WHERE "content" IS NOT NULL;

    -- 3e. Preserve posts_citations bibliography/url.
    INSERT INTO "posts_citations_locales" ("_parent_id", "_locale", "bibliography", "url")
    SELECT "id", 'en'::"_locales", "bibliography", "url"
    FROM "posts_citations"
    WHERE "bibliography" IS NOT NULL OR "url" IS NOT NULL;

    INSERT INTO "_posts_v_version_citations_locales" ("_parent_id", "_locale", "bibliography", "url")
    SELECT "id", 'en'::"_locales", "bibliography", "url"
    FROM "_posts_v_version_citations"
    WHERE "bibliography" IS NOT NULL OR "url" IS NOT NULL;

    -- 4a. Drop migrated columns from posts. Auto-drops the unique-on-slug index.
    ALTER TABLE "posts" DROP COLUMN "title";
    ALTER TABLE "posts" DROP COLUMN "slug";
    ALTER TABLE "posts" DROP COLUMN "generate_slug";
    ALTER TABLE "posts" DROP COLUMN "questions_to_ask_doctor";

    -- 4b. Drop migrated columns from _posts_v.
    ALTER TABLE "_posts_v" DROP COLUMN "version_title";
    ALTER TABLE "_posts_v" DROP COLUMN "version_slug";
    ALTER TABLE "_posts_v" DROP COLUMN "version_generate_slug";
    ALTER TABLE "_posts_v" DROP COLUMN "version_questions_to_ask_doctor";

    -- 4c. Drop migrated columns from array tables.
    ALTER TABLE "posts_benefits" DROP COLUMN "title";
    ALTER TABLE "posts_benefits" DROP COLUMN "description";
    ALTER TABLE "_posts_v_version_benefits" DROP COLUMN "title";
    ALTER TABLE "_posts_v_version_benefits" DROP COLUMN "description";

    ALTER TABLE "posts_category_sections" DROP COLUMN "content";
    ALTER TABLE "_posts_v_version_category_sections" DROP COLUMN "content";

    ALTER TABLE "posts_citations" DROP COLUMN "bibliography";
    ALTER TABLE "posts_citations" DROP COLUMN "url";
    ALTER TABLE "_posts_v_version_citations" DROP COLUMN "bibliography";
    ALTER TABLE "_posts_v_version_citations" DROP COLUMN "url";

    -- 5a. Indexes for posts_locales.slug (unique within locale + lookup).
    --     Same name pattern Drizzle would generate for a localized slug field.
    CREATE INDEX "posts_slug_idx" ON "posts_locales" USING btree ("slug","_locale");
    CREATE UNIQUE INDEX "posts_slug_locale_unique" ON "posts_locales" USING btree ("slug","_locale");

    -- 5b. Unique index for _posts_v_version_slug per (locale, parent).
    CREATE INDEX "_posts_v_version_slug_idx" ON "_posts_v_locales" USING btree ("version_slug","_locale");

    -- 5c. Unique constraints on the new array _locales tables — one row per
    --     (parent array row id, locale).
    CREATE UNIQUE INDEX "posts_benefits_locales_locale_parent_id_unique"
      ON "posts_benefits_locales" USING btree ("_locale","_parent_id");
    CREATE UNIQUE INDEX "_posts_v_version_benefits_locales_locale_parent_id_unique"
      ON "_posts_v_version_benefits_locales" USING btree ("_locale","_parent_id");
    CREATE UNIQUE INDEX "posts_category_sections_locales_locale_parent_id_unique"
      ON "posts_category_sections_locales" USING btree ("_locale","_parent_id");
    CREATE UNIQUE INDEX "_posts_v_version_category_sections_locales_locale_parent_id_unique"
      ON "_posts_v_version_category_sections_locales" USING btree ("_locale","_parent_id");
    CREATE UNIQUE INDEX "posts_citations_locales_locale_parent_id_unique"
      ON "posts_citations_locales" USING btree ("_locale","_parent_id");
    CREATE UNIQUE INDEX "_posts_v_version_citations_locales_locale_parent_id_unique"
      ON "_posts_v_version_citations_locales" USING btree ("_locale","_parent_id");

    -- 6. Tracking columns for Phase 5 stale-field detection.
    ALTER TABLE "posts" ADD COLUMN "translated_at" timestamp(3) with time zone;
    ALTER TABLE "posts" ADD COLUMN "en_updated_at" timestamp(3) with time zone;
    ALTER TABLE "_posts_v" ADD COLUMN "version_translated_at" timestamp(3) with time zone;
    ALTER TABLE "_posts_v" ADD COLUMN "version_en_updated_at" timestamp(3) with time zone;
  `)
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Reverse of 6.
    ALTER TABLE "_posts_v" DROP COLUMN IF EXISTS "version_translated_at";
    ALTER TABLE "_posts_v" DROP COLUMN IF EXISTS "version_en_updated_at";
    ALTER TABLE "posts" DROP COLUMN IF EXISTS "translated_at";
    ALTER TABLE "posts" DROP COLUMN IF EXISTS "en_updated_at";

    -- Reverse of 5: drop the new indexes (will be auto-dropped with their tables/columns below;
    --             explicit DROP IF EXISTS keeps the down() idempotent if a partial down was tried).
    DROP INDEX IF EXISTS "posts_slug_locale_unique";
    DROP INDEX IF EXISTS "posts_slug_idx";
    DROP INDEX IF EXISTS "_posts_v_version_slug_idx";
    DROP INDEX IF EXISTS "posts_benefits_locales_locale_parent_id_unique";
    DROP INDEX IF EXISTS "_posts_v_version_benefits_locales_locale_parent_id_unique";
    DROP INDEX IF EXISTS "posts_category_sections_locales_locale_parent_id_unique";
    DROP INDEX IF EXISTS "_posts_v_version_category_sections_locales_locale_parent_id_unique";
    DROP INDEX IF EXISTS "posts_citations_locales_locale_parent_id_unique";
    DROP INDEX IF EXISTS "_posts_v_version_citations_locales_locale_parent_id_unique";

    -- Reverse of 4: re-add the parent columns.
    ALTER TABLE "posts" ADD COLUMN "title" varchar;
    ALTER TABLE "posts" ADD COLUMN "slug" varchar;
    ALTER TABLE "posts" ADD COLUMN "generate_slug" boolean DEFAULT true;
    ALTER TABLE "posts" ADD COLUMN "questions_to_ask_doctor" jsonb;

    ALTER TABLE "_posts_v" ADD COLUMN "version_title" varchar;
    ALTER TABLE "_posts_v" ADD COLUMN "version_slug" varchar;
    ALTER TABLE "_posts_v" ADD COLUMN "version_generate_slug" boolean DEFAULT true;
    ALTER TABLE "_posts_v" ADD COLUMN "version_questions_to_ask_doctor" jsonb;

    ALTER TABLE "posts_benefits" ADD COLUMN "title" varchar;
    ALTER TABLE "posts_benefits" ADD COLUMN "description" varchar;
    ALTER TABLE "_posts_v_version_benefits" ADD COLUMN "title" varchar;
    ALTER TABLE "_posts_v_version_benefits" ADD COLUMN "description" varchar;

    ALTER TABLE "posts_category_sections" ADD COLUMN "content" jsonb;
    ALTER TABLE "_posts_v_version_category_sections" ADD COLUMN "content" jsonb;

    ALTER TABLE "posts_citations" ADD COLUMN "bibliography" varchar;
    ALTER TABLE "posts_citations" ADD COLUMN "url" varchar;
    ALTER TABLE "_posts_v_version_citations" ADD COLUMN "bibliography" varchar;
    ALTER TABLE "_posts_v_version_citations" ADD COLUMN "url" varchar;

    -- Restore data from EN locale rows back into the parent tables.
    UPDATE "posts" p
    SET "title" = l."title",
        "slug" = l."slug",
        "generate_slug" = l."generate_slug",
        "questions_to_ask_doctor" = l."questions_to_ask_doctor"
    FROM "posts_locales" l
    WHERE l."_parent_id" = p."id" AND l."_locale" = 'en';

    UPDATE "_posts_v" v
    SET "version_title" = l."version_title",
        "version_slug" = l."version_slug",
        "version_generate_slug" = l."version_generate_slug",
        "version_questions_to_ask_doctor" = l."version_questions_to_ask_doctor"
    FROM "_posts_v_locales" l
    WHERE l."_parent_id" = v."id" AND l."_locale" = 'en';

    UPDATE "posts_benefits" b
    SET "title" = l."title", "description" = l."description"
    FROM "posts_benefits_locales" l
    WHERE l."_parent_id" = b."id" AND l."_locale" = 'en';

    UPDATE "_posts_v_version_benefits" b
    SET "title" = l."title", "description" = l."description"
    FROM "_posts_v_version_benefits_locales" l
    WHERE l."_parent_id" = b."id" AND l."_locale" = 'en';

    UPDATE "posts_category_sections" s
    SET "content" = l."content"
    FROM "posts_category_sections_locales" l
    WHERE l."_parent_id" = s."id" AND l."_locale" = 'en';

    UPDATE "_posts_v_version_category_sections" s
    SET "content" = l."content"
    FROM "_posts_v_version_category_sections_locales" l
    WHERE l."_parent_id" = s."id" AND l."_locale" = 'en';

    UPDATE "posts_citations" c
    SET "bibliography" = l."bibliography", "url" = l."url"
    FROM "posts_citations_locales" l
    WHERE l."_parent_id" = c."id" AND l."_locale" = 'en';

    UPDATE "_posts_v_version_citations" c
    SET "bibliography" = l."bibliography", "url" = l."url"
    FROM "_posts_v_version_citations_locales" l
    WHERE l."_parent_id" = c."id" AND l."_locale" = 'en';

    -- Reverse of 2: drop new _locales companion tables.
    DROP TABLE IF EXISTS "_posts_v_version_citations_locales" CASCADE;
    DROP TABLE IF EXISTS "posts_citations_locales" CASCADE;
    DROP TABLE IF EXISTS "_posts_v_version_category_sections_locales" CASCADE;
    DROP TABLE IF EXISTS "posts_category_sections_locales" CASCADE;
    DROP TABLE IF EXISTS "_posts_v_version_benefits_locales" CASCADE;
    DROP TABLE IF EXISTS "posts_benefits_locales" CASCADE;

    -- Reverse of 1: remove the new columns from existing _locales tables.
    ALTER TABLE "_posts_v_locales" DROP COLUMN IF EXISTS "version_questions_to_ask_doctor";
    ALTER TABLE "_posts_v_locales" DROP COLUMN IF EXISTS "version_generate_slug";
    ALTER TABLE "_posts_v_locales" DROP COLUMN IF EXISTS "version_slug";
    ALTER TABLE "_posts_v_locales" DROP COLUMN IF EXISTS "version_title";
    ALTER TABLE "posts_locales" DROP COLUMN IF EXISTS "questions_to_ask_doctor";
    ALTER TABLE "posts_locales" DROP COLUMN IF EXISTS "generate_slug";
    ALTER TABLE "posts_locales" DROP COLUMN IF EXISTS "slug";
    ALTER TABLE "posts_locales" DROP COLUMN IF EXISTS "title";

    -- Original unique constraint on posts.slug.
    CREATE UNIQUE INDEX IF NOT EXISTS "posts_slug_idx" ON "posts" USING btree ("slug");
  `)
}

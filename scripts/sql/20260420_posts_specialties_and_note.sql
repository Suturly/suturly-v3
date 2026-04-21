-- Run once on production Postgres (e.g. Neon) when Payload schema was not auto-pushed
-- (Vercel sets NODE_ENV=production, so db push does not run there).
-- Fixes: relation "posts_specialties" does not exist during `next build` SSG of /resources.

-- Optional internal editor note on resources (safe if already present)
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "note" text;

-- Enum values must match src/collections/Resources/index.ts RESOURCE_SPECIALTY_OPTIONS
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_posts_specialties') THEN
    CREATE TYPE "enum_posts_specialties" AS ENUM (
      'plastic_reconstructive',
      'orthopedic',
      'gastroenterology',
      'bariatric',
      'dermatology',
      'otolaryngology'
    );
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "posts_specialties" (
  "id" serial PRIMARY KEY NOT NULL,
  "order" integer NOT NULL,
  "parent_id" integer NOT NULL,
  "value" "enum_posts_specialties" NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'posts_specialties_parent_fk'
  ) THEN
    ALTER TABLE "posts_specialties"
      ADD CONSTRAINT "posts_specialties_parent_fk"
      FOREIGN KEY ("parent_id") REFERENCES "posts"("id") ON DELETE CASCADE;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "posts_specialties_order_idx" ON "posts_specialties" ("order");
CREATE INDEX IF NOT EXISTS "posts_specialties_parent_idx" ON "posts_specialties" ("parent_id");

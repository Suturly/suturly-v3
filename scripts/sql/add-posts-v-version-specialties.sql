-- Fix: relation "_posts_v_version_specialties" does not exist
-- When `specialties` was added to Resources (posts), prod may have gotten `posts_specialties`
-- but not the draft-version table. Admin `findByID` with draft:true joins this table.
--
-- Run on the Neon branch used by production DATABASE_URL.

-- Enum for version rows (separate type name from enum_posts_specialties; same labels)
DO $$ BEGIN
  CREATE TYPE "enum__posts_v_version_specialties" AS ENUM (
    'plastic_reconstructive',
    'orthopedic',
    'gastroenterology',
    'bariatric',
    'dermatology',
    'otolaryngology'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "_posts_v_version_specialties" (
  "id" serial PRIMARY KEY,
  "order" integer NOT NULL,
  "parent_id" integer NOT NULL,
  "value" "enum__posts_v_version_specialties",
  CONSTRAINT "_posts_v_version_specialties_parent_fk"
    FOREIGN KEY ("parent_id") REFERENCES "_posts_v"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "_posts_v_version_specialties_order_idx"
  ON "_posts_v_version_specialties" ("order");
CREATE INDEX IF NOT EXISTS "_posts_v_version_specialties_parent_idx"
  ON "_posts_v_version_specialties" ("parent_id");

-- Optional: copy current published specialties onto each **latest** draft version row
-- so the editor matches the live post until the next save. Safe to re-run.
INSERT INTO "_posts_v_version_specialties" ("order", "parent_id", "value")
SELECT
  ps."order",
  v."id",
  ps."value"::text::"enum__posts_v_version_specialties"
FROM "posts_specialties" ps
JOIN "_posts_v" v ON v."parent_id" = ps."parent_id" AND v."latest" IS TRUE
WHERE NOT EXISTS (
  SELECT 1
  FROM "_posts_v_version_specialties" x
  WHERE x."parent_id" = v."id" AND x."order" = ps."order"
);

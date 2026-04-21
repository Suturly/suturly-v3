-- Fix: admin list for Resources (posts) fails with:
--   column "version_note" does not exist
-- Run against the SAME Neon branch as production DATABASE_URL (usually `main`).
-- Safe to re-run: IF NOT EXISTS guards.

ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "note" text;

ALTER TABLE "_posts_v" ADD COLUMN IF NOT EXISTS "version_note" text;

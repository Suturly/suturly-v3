import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Move `title`, `nextStepBannerTitle`, `nextStepBannerDescription` from `categories` into
 * `categories_locales` (EN + seeded ES) to match Payload localized field config.
 *
 * Safe to run once; `up` assumes legacy flat columns still exist on `categories`.
 */
export async function up({ db, payload: _payload, req: _req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "categories_locales" (
      "title" varchar,
      "next_step_banner_title" varchar,
      "next_step_banner_description" varchar,
      "id" serial PRIMARY KEY NOT NULL,
      "_locale" "_locales" NOT NULL,
      "_parent_id" integer NOT NULL
    );

    DO $$ BEGIN
      ALTER TABLE "categories_locales" ADD CONSTRAINT "categories_locales_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."categories"("id")
        ON DELETE CASCADE ON UPDATE NO ACTION;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    INSERT INTO "categories_locales" (
      "_parent_id",
      "_locale",
      "title",
      "next_step_banner_title",
      "next_step_banner_description"
    )
    SELECT
      c."id",
      'en'::"_locales",
      c."title",
      c."next_step_banner_title",
      c."next_step_banner_description"
    FROM "categories" c
    WHERE NOT EXISTS (
      SELECT 1 FROM "categories_locales" cl
      WHERE cl."_parent_id" = c."id" AND cl."_locale" = 'en'::"_locales"
    );
  `)

  await db.execute(sql`
    INSERT INTO "categories_locales" (
      "_parent_id",
      "_locale",
      "title",
      "next_step_banner_title",
      "next_step_banner_description"
    )
    SELECT
      c."id",
      'es'::"_locales",
      (CASE c."slug"
        WHEN 'educatin' THEN 'EDUCACIÓN'
        WHEN 'pre-op' THEN 'PREOPERATORIO'
        WHEN 'operation-day' THEN 'DÍA DE LA OPERACIÓN'
        WHEN 'post-op' THEN 'POSTOPERATORIO'
        WHEN 'next-steps' THEN 'PRÓXIMOS PASOS'
        ELSE c."title"
      END),
      (CASE c."slug"
        WHEN 'educatin' THEN 'Comprenda la línea de tiempo de su tratamiento'
        WHEN 'pre-op' THEN 'Prepárese para el día de la operación'
        WHEN 'operation-day' THEN 'Planifique su recuperación postoperatoria'
        WHEN 'post-op' THEN 'Prepare sus próximos pasos'
        WHEN 'next-steps' THEN 'Continúe su seguimiento a largo plazo'
        ELSE NULL
      END),
      (CASE c."slug"
        WHEN 'educatin' THEN 'Revise la preparación preoperatoria para reducir riesgos y mejorar la recuperación.'
        WHEN 'pre-op' THEN 'Siga las indicaciones del día de la cirugía para que el procedimiento sea seguro y a tiempo.'
        WHEN 'operation-day' THEN 'Sepa qué esperar en la primera fase de recuperación y cuándo contactar a su cirujano.'
        WHEN 'post-op' THEN 'Haga seguimiento a hitos, señales de alerta y recomendaciones de cuidado a largo plazo.'
        WHEN 'next-steps' THEN 'Mantenga sus controles y comente cualquier cambio con su médico.'
        ELSE NULL
      END)
    FROM "categories" c
    WHERE NOT EXISTS (
      SELECT 1 FROM "categories_locales" cl
      WHERE cl."_parent_id" = c."id" AND cl."_locale" = 'es'::"_locales"
    );
  `)

  await db.execute(sql`
    ALTER TABLE "categories" DROP COLUMN IF EXISTS "title";
    ALTER TABLE "categories" DROP COLUMN IF EXISTS "next_step_banner_title";
    ALTER TABLE "categories" DROP COLUMN IF EXISTS "next_step_banner_description";
  `)

  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS "categories_locales_locale_parent_id_unique"
      ON "categories_locales" USING btree ("_locale", "_parent_id");
  `)
}

export async function down({ db, payload: _payload, req: _req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "title" varchar;
    ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "next_step_banner_title" varchar;
    ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "next_step_banner_description" varchar;

    UPDATE "categories" c
    SET
      "title" = cl."title",
      "next_step_banner_title" = cl."next_step_banner_title",
      "next_step_banner_description" = cl."next_step_banner_description"
    FROM "categories_locales" cl
    WHERE cl."_parent_id" = c."id" AND cl."_locale" = 'en'::"_locales";

    DROP INDEX IF EXISTS "categories_locales_locale_parent_id_unique";
    DROP TABLE IF EXISTS "categories_locales" CASCADE;
  `)
}

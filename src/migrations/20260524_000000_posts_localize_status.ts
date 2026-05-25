import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'
import { localizeStatus } from 'payload/migrations'

/**
 * Per-locale publish status for Resources (`posts` collection only).
 * Converts document-level `_status` into `{ en, es }` on version + posts_locales rows.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await localizeStatus.up({
    collectionSlug: 'posts',
    db,
    payload,
    req,
    sql,
  })
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await localizeStatus.down({
    collectionSlug: 'posts',
    db,
    payload,
    req,
    sql,
  })
}

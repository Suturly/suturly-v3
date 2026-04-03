import type { CollectionAfterReadHook } from 'payload'

import { migrateLegacyLinkCitationsToInline, type MigrateDoc } from '@/utilities/legacyCitationMigration'

/** In-memory migration so API/frontend see inline citations + registry before DB is re-saved. */
export const migrateLegacyCitationsAfterRead: CollectionAfterReadHook = ({ doc }) => {
  if (doc && typeof doc === 'object') {
    migrateLegacyLinkCitationsToInline(doc as MigrateDoc)
  }
  return doc
}

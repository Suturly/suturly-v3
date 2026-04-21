import type { CollectionAfterReadHook } from 'payload'

import { migrateLegacyLinkCitationsToInline, type MigrateDoc } from '@/utilities/legacyCitationMigration'
import { migrateLegacyProcedureShortDescriptionStrings } from '@/utilities/migrateLegacyProcedureShortDescription'

/** In-memory migration so API/frontend see inline citations + registry before DB is re-saved. */
export const migrateLegacyCitationsAfterRead: CollectionAfterReadHook = ({ doc, findMany }) => {
  // Admin list + API pagination: skip heavy tree walks (not needed for table columns / shallow views).
  if (findMany) return doc
  if (doc && typeof doc === 'object') {
    migrateLegacyProcedureShortDescriptionStrings(doc as MigrateDoc)
    migrateLegacyLinkCitationsToInline(doc as MigrateDoc)
  }
  return doc
}

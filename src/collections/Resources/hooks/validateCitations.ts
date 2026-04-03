import type { CollectionBeforeValidateHook } from 'payload'
import { ValidationError } from 'payload'
import { randomUUID } from 'node:crypto'

import { migrateLegacyLinkCitationsToInline, type MigrateDoc } from '@/utilities/legacyCitationMigration'
import { walkLexicalForCitationRefKeys } from '@/utilities/walkLexicalForCitationRefKeys'

export const validateResourceCitations: CollectionBeforeValidateHook = ({ collection, data, req }) => {
  const doc = data as MigrateDoc | undefined
  if (!doc || typeof doc !== 'object') return

  migrateLegacyLinkCitationsToInline(doc)

  const rows = Array.isArray(doc.citations) ? doc.citations : []
  for (const row of rows) {
    const k = typeof row.key === 'string' ? row.key.trim() : ''
    if (!k) {
      row.key = randomUUID()
    }
  }

  const registryKeys = new Set<string>()
  for (const row of rows) {
    const k = typeof row.key === 'string' ? row.key.trim() : ''
    if (!k) continue
    if (registryKeys.has(k)) {
      throw new ValidationError({
        collection: collection.slug,
        errors: [
          {
            message: `Duplicate citation key "${k}". Each Citations entry must have a unique key.`,
            path: 'citations',
          },
        ],
        req,
      })
    }
    registryKeys.add(k)
  }

  const used = new Set<string>()
  walkLexicalForCitationRefKeys(doc, used)

  for (const k of used) {
    if (!registryKeys.has(k)) {
      throw new ValidationError({
        collection: collection.slug,
        errors: [
          {
            message: `Inline citation uses key "${k}" but no matching row exists on the Citations tab. Add a row with that key or fix the inline citation.`,
            path: 'citations',
          },
        ],
        req,
      })
    }
  }

  // Do not return `true` — Payload does `data = (await hook()) || data`, so a truthy non-object replaces the document.
}

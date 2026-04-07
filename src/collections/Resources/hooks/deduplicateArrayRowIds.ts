import type { CollectionBeforeChangeHook } from 'payload'
import { randomUUID } from 'node:crypto'

/**
 * Ensures every row in the top-level array fields of a Resource document has a
 * unique `id`. Payload uses these ids as React keys in the admin UI — duplicate
 * ids produce "two children with the same key" console errors.
 *
 * Duplicates are regenerated rather than removed so no content is lost.
 */
export const deduplicateArrayRowIds: CollectionBeforeChangeHook = ({ data }) => {
  const ARRAY_FIELDS = ['benefits', 'categorySections', 'citations', 'populatedAuthors'] as const

  for (const field of ARRAY_FIELDS) {
    const rows = data?.[field]
    if (!Array.isArray(rows)) continue

    const seen = new Set<string>()
    for (const row of rows) {
      if (!row || typeof row !== 'object') continue
      const id = typeof row.id === 'string' ? row.id.trim() : ''
      if (!id || seen.has(id)) {
        row.id = randomUUID().replace(/-/g, '')
      } else {
        seen.add(id)
      }
    }
  }

  // Do not return — Payload does `data = (await hook()) || data`
}

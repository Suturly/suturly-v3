import type { CollectionAfterReadHook } from 'payload'
import { createLocalReq } from 'payload'

import type { Post } from '@/payload-types'
import { mergeEsResourceContentFromEn } from '@/utilities/mergeEsResourceContentFromEn'

/**
 * Admin-only: fills Spanish **detail** views where Payload read fallback doesn’t apply (empty Lexical,
 * arrays, etc.). Admin **list** title/slug use {@link mergeEnglishListColumnsAfterFind} (Select API).
 *
 * Skips anonymous reads and list index rows ({@link findMany}) for performance — same pattern as {@link populateAuthors}.
 */
export const mergeEnglishIntoSpanishAdminRead: CollectionAfterReadHook = async ({
  doc,
  findMany,
  req,
}) => {
  if (findMany) return doc
  if (!req.user) return doc
  if (req.locale !== 'es') return doc
  if ((doc as Post).spanishMirrorsEnglish === false) return doc

  try {
    const enReq = await createLocalReq({ locale: 'en', user: req.user }, req.payload)
    const enDoc = await req.payload.findByID({
      collection: 'posts',
      id: doc.id,
      draft: doc._status === 'draft',
      depth: 10,
      overrideAccess: true,
      req: enReq,
    })

    if (!enDoc) return doc

    return mergeEsResourceContentFromEn(doc as Post, enDoc as Post)
  } catch {
    return doc
  }
}

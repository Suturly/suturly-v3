import type { CollectionAfterChangeHook } from 'payload'

import type { Post } from '@/payload-types'
import { mergeSpanishFromEnglishForPost } from '@/translators/mergeSpanishFromEnglish'
import { requestIsAutosave } from '@/utilities/requestIsAutosave'

/**
 * After every English save (default locale or explicit `en`), mirror localized content
 * into `es` while {@link Post.spanishMirrorsEnglish} stays true.
 *
 * Skips `locale === 'all'` (combined locale editor could mix ES edits).
 * Programmatic ES writes set {@link PayloadRequest.context.skipSpanishMirroringDetect};
 * mirror merges set {@link PayloadRequest.context.skipEsAutoSync}.
 *
 * Mirroring stops when {@link Post.spanishMirrorsEnglish} becomes false (see stampSpanishMirroringStop).
 * That flag has no admin UI — it flips off automatically when Spanish localized fields diverge on save.
 */
export const syncEnglishToSpanish: CollectionAfterChangeHook<Post> = async ({
  doc,
  req,
  context,
}) => {
  if (context?.skipEsAutoSync) return doc
  if (doc.spanishMirrorsEnglish === false) return doc
  if (requestIsAutosave(req)) return doc

  const locale = req.locale
  if (locale === 'es' || locale === 'all') return doc

  await mergeSpanishFromEnglishForPost(req, doc.id, {
    draft: doc._status !== 'published',
  })

  return doc
}

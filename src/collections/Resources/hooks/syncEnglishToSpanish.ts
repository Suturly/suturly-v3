import type { CollectionAfterChangeHook } from 'payload'

import type { Post } from '@/payload-types'
import { mergeSpanishFromEnglishForPost } from '@/translators/mergeSpanishFromEnglish'
import { normalizeEnMirroredFieldPaths } from '@/utilities/enMirroredFieldPaths'
import { isLocalePublished } from '@/utilities/localePublishStatus'
import { requestIsAutosave } from '@/utilities/requestIsAutosave'

function isPublishedForMirror(doc: Post): boolean {
  const status = doc._status
  if (typeof status === 'object' && status !== null) {
    return isLocalePublished(status, 'en') || isLocalePublished(status, 'es')
  }
  return status === 'published'
}

/**
 * After every English save (default locale or explicit `en`), mirror localized content
 * into `es` while {@link Post.spanishMirrorsEnglish} stays true, or mirror only paths
 * listed in {@link Post.enMirroredFieldPaths} when the document is detached.
 */
export const syncEnglishToSpanish: CollectionAfterChangeHook<Post> = async ({
  doc,
  req,
  context,
}) => {
  if (context?.skipEsAutoSync) return doc
  if (requestIsAutosave(req)) return doc

  const locale = req.locale
  if (locale === 'es' || locale === 'all') return doc

  const draft = !isPublishedForMirror(doc)
  const fullyLinked = doc.spanishMirrorsEnglish !== false

  if (fullyLinked) {
    await mergeSpanishFromEnglishForPost(req, doc.id, { draft })
    return doc
  }

  const fieldPaths = normalizeEnMirroredFieldPaths(doc.enMirroredFieldPaths)
  if (fieldPaths.length === 0) return doc

  await mergeSpanishFromEnglishForPost(req, doc.id, {
    draft,
    fieldPaths,
  })

  return doc
}

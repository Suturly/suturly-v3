import { isDeepStrictEqual } from 'node:util'

import type { CollectionAfterChangeHook } from 'payload'

import type { Post } from '@/payload-types'
import { requestIsAutosave } from '@/utilities/requestIsAutosave'

/** Localized subtree compared on ES saves to detect manual Spanish edits vs structural-only writes. */
function pickLocalizedMirrorSlice(post: Partial<Post> | undefined): unknown {
  if (!post) return {}
  return {
    title: post.title,
    slug: post.slug,
    generateSlug: post.generateSlug,
    benefits: post.benefits,
    categorySections: post.categorySections,
    citations: post.citations,
    meta: post.meta,
    questionsToAskDoctor: post.questionsToAskDoctor,
  }
}

/**
 * When editors save Spanish (`locale === 'es'`) and localized fields actually changed,
 * flip {@link Post.spanishMirrorsEnglish} off so EN edits no longer overwrite Spanish.
 *
 * Skipped when {@link PayloadRequest.context.skipSpanishMirroringDetect} is set
 * (Translate all, identity mirror merge, backfill script).
 */
export const stampSpanishMirroringStop: CollectionAfterChangeHook<Post> = async ({
  doc,
  previousDoc,
  req,
  operation,
  context,
}) => {
  if (context?.skipSpanishMirroringDetect) return doc
  if (requestIsAutosave(req)) return doc
  if (operation !== 'update') return doc
  if (req.locale !== 'es') return doc
  if (doc.spanishMirrorsEnglish === false) return doc

  const prevPick = pickLocalizedMirrorSlice(previousDoc ?? undefined)
  const nextPick = pickLocalizedMirrorSlice(doc)
  if (isDeepStrictEqual(prevPick, nextPick)) return doc

  try {
    await req.payload.update({
      collection: 'posts',
      id: doc.id,
      locale: 'es',
      data: { spanishMirrorsEnglish: false },
      depth: 0,
      draft: doc._status !== 'published',
      overrideAccess: true,
      req,
      context: {
        skipSpanishMirroringDetect: true,
        skipEnUpdatedAt: true,
        skipEsAutoSync: true,
      },
    })
  } catch (err) {
    req.payload.logger.error(
      { err, postId: doc.id },
      'stampSpanishMirroringStop: failed to persist spanishMirrorsEnglish=false',
    )
  }

  return doc
}

import { isDeepStrictEqual } from 'node:util'

import type { CollectionAfterChangeHook } from 'payload'

import type { Post } from '@/payload-types'
import {
  collectChangedLocalizedPaths,
  normalizeEnMirroredFieldPaths,
  removeEnMirroredFieldPaths,
} from '@/utilities/enMirroredFieldPaths'
import type { LocaleStatusMap } from '@/utilities/localePublishStatus'
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

function isPublishedDoc(doc: Post): boolean {
  const status = doc._status as unknown
  if (typeof status === 'object' && status !== null) {
    const map = status as LocaleStatusMap
    return map.es === 'published' || map.en === 'published'
  }
  return status === 'published'
}

/**
 * When editors save Spanish (`locale === 'es'`) and localized fields actually changed:
 * - Fully linked doc → flip {@link Post.spanishMirrorsEnglish} off and clear paths.
 * - Detached doc → remove changed paths from {@link Post.enMirroredFieldPaths} only.
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

  const prevPick = pickLocalizedMirrorSlice(previousDoc ?? undefined)
  const nextPick = pickLocalizedMirrorSlice(doc)
  if (isDeepStrictEqual(prevPick, nextPick)) return doc

  const changedPaths = collectChangedLocalizedPaths(prevPick, nextPick)
  const draft = !isPublishedDoc(doc)

  if (doc.spanishMirrorsEnglish !== false) {
    try {
      await req.payload.update({
        collection: 'posts',
        id: doc.id,
        data: {
          spanishMirrorsEnglish: false,
          enMirroredFieldPaths: [],
        },
        depth: 0,
        draft,
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

  const currentPaths = normalizeEnMirroredFieldPaths(doc.enMirroredFieldPaths)
  if (currentPaths.length === 0) return doc

  const nextPaths = removeEnMirroredFieldPaths(currentPaths, changedPaths)
  if (nextPaths.length === currentPaths.length) return doc

  try {
    await req.payload.update({
      collection: 'posts',
      id: doc.id,
      data: { enMirroredFieldPaths: nextPaths },
      depth: 0,
      draft,
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
      'stampSpanishMirroringStop: failed to trim enMirroredFieldPaths',
    )
  }

  return doc
}

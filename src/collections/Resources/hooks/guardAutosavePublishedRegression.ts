import type { CollectionAfterChangeHook } from 'payload'

import type { Post } from '@/payload-types'
import {
  anyLocalePublished,
  ensureLocaleStatusObject,
  isLocalePublished,
} from '@/utilities/localePublishStatus'
import { requestIsAutosave } from '@/utilities/requestIsAutosave'

import { SKIP_LINKED_LOCALE_PUBLISH_CONTEXT } from './finalizeLinkedLocalePublish'

/** Payload autosave treats localized `_status` objects as draft (`data._status !== 'published'`). */
export const SKIP_AUTOSAVE_PUBLISHED_GUARD_CONTEXT = 'skipAutosavePublishedGuard'

/**
 * When autosave runs after a localized publish, Payload can save a draft version even though the
 * live document was published. Restore published locale status from the pre-autosave document.
 */
export const guardAutosavePublishedRegression: CollectionAfterChangeHook<Post> = async ({
  doc,
  previousDoc,
  req,
  context,
}) => {
  if (context?.[SKIP_AUTOSAVE_PUBLISHED_GUARD_CONTEXT]) return doc
  if (!requestIsAutosave(req)) return doc
  if (!previousDoc?.id) return doc
  if (!anyLocalePublished(previousDoc._status)) return doc
  if (anyLocalePublished(doc._status)) return doc

  const prev = ensureLocaleStatusObject(previousDoc._status)
  const linked = doc.spanishMirrorsEnglish !== false

  try {
    if (linked && prev.en === 'published' && prev.es === 'published') {
      await req.payload.update({
        collection: 'posts',
        id: doc.id,
        data: {},
        draft: false,
        publishAllLocales: true,
        locale: 'en',
        depth: 0,
        overrideAccess: true,
        req,
        context: {
          [SKIP_AUTOSAVE_PUBLISHED_GUARD_CONTEXT]: true,
          [SKIP_LINKED_LOCALE_PUBLISH_CONTEXT]: true,
          skipEsAutoSync: true,
          skipEnUpdatedAt: true,
          skipSpanishMirroringDetect: true,
        },
      })
      return doc
    }

    for (const locale of ['en', 'es'] as const) {
      if (prev[locale] !== 'published' || isLocalePublished(doc._status, locale)) continue

      await req.payload.update({
        collection: 'posts',
        id: doc.id,
        data: { _status: 'published' },
        draft: false,
        publishSpecificLocale: locale,
        locale,
        depth: 0,
        overrideAccess: true,
        req,
        context: {
          [SKIP_AUTOSAVE_PUBLISHED_GUARD_CONTEXT]: true,
          [SKIP_LINKED_LOCALE_PUBLISH_CONTEXT]: true,
          skipEsAutoSync: true,
          skipEnUpdatedAt: true,
          skipSpanishMirroringDetect: true,
        },
      })
    }
  } catch (err) {
    req.payload.logger.error(
      { err, postId: doc.id },
      'guardAutosavePublishedRegression: failed to restore published status',
    )
  }

  return doc
}

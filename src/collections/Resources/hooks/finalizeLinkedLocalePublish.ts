import type { CollectionAfterChangeHook } from 'payload'

import type { Post } from '@/payload-types'
import { requestIsAutosave } from '@/utilities/requestIsAutosave'

/** Context flag set by {@link linkedLocalePublish} when a linked EN publish should commit both locales. */
export const LINKED_LOCALE_PUBLISH_CONTEXT = 'linkedLocalePublishRequested'
export const SKIP_LINKED_LOCALE_PUBLISH_CONTEXT = 'skipLinkedLocalePublish'

/**
 * Payload `defaultLocalePublishOption: 'active'` publishes one locale only. Manually setting
 * `_status` to a per-locale object in beforeChange does not reliably persist both locales.
 * After the primary save, call `publishAllLocales` so EN + ES are published on the live document.
 */
export const finalizeLinkedLocalePublish: CollectionAfterChangeHook<Post> = async ({
  doc,
  req,
  context,
}) => {
  if (context?.[SKIP_LINKED_LOCALE_PUBLISH_CONTEXT]) return doc
  if (!context?.[LINKED_LOCALE_PUBLISH_CONTEXT]) return doc
  if (requestIsAutosave(req)) return doc

  try {
    const updated = await req.payload.update({
      collection: 'posts',
      id: doc.id,
      data: {},
      draft: false,
      publishAllLocales: true,
      locale: req.locale === 'es' ? 'es' : 'en',
      depth: 0,
      overrideAccess: true,
      req,
      context: {
        [SKIP_LINKED_LOCALE_PUBLISH_CONTEXT]: true,
        skipEsAutoSync: true,
        skipEnUpdatedAt: true,
        skipSpanishMirroringDetect: true,
        skipAutosavePublishedGuard: true,
      },
    })

    return (updated as Post) ?? doc
  } catch (err) {
    req.payload.logger.error(
      { err, postId: doc.id },
      'finalizeLinkedLocalePublish: publishAllLocales failed',
    )
  }

  return doc
}

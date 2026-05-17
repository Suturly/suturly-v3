import type { CollectionAfterChangeHook } from 'payload'

import { requestIsAutosave } from '@/utilities/requestIsAutosave'

/**
 * Stamps `enUpdatedAt` on every save that touches the EN locale. The frontend
 * + admin compare this against `translatedAt` to detect Spanish fields that
 * have gone stale relative to their English source (Phase 5 stale-field UI).
 *
 * Recursion guard: this hook itself issues a payload.update() to write the
 * timestamp, which would re-trigger the hook. The `skipEnUpdatedAt` context
 * flag short-circuits the second invocation. The same flag is set by the
 * Translate-all action (Phase 3) to mark the EN side untouched even though
 * we wrote ES content alongside it.
 *
 * Locale handling:
 *  - `req.locale === 'en'`: a direct EN edit -> stamp.
 *  - `req.locale === 'all'`: the admin "All Locales" view edit -> stamp,
 *    because the admin user had EN content in scope.
 *  - `req.locale === 'es'`: ES-only edit -> do not stamp (this is the
 *    translation/correction path).
 *  - undefined: server-side hooks without an explicit locale fall back to
 *    the default locale (`en` per payload.config.ts), so we treat that as EN.
 */
export const trackEnUpdatedAt: CollectionAfterChangeHook = async ({
  doc,
  req,
  context,
}) => {
  if (context?.skipEnUpdatedAt) return doc
  if (requestIsAutosave(req)) return doc

  const locale = req.locale
  if (locale && locale !== 'en' && locale !== 'all') return doc

  try {
    await req.payload.update({
      collection: 'posts',
      id: doc.id,
      data: { enUpdatedAt: new Date().toISOString() },
      locale: 'en',
      depth: 0,
      draft: doc._status !== 'published',
      overrideAccess: true,
      req,
      context: { skipEnUpdatedAt: true, skipEsAutoSync: true },
    })
  } catch (err) {
    req.payload.logger.error(
      { err, postId: doc.id },
      'trackEnUpdatedAt: failed to stamp enUpdatedAt',
    )
  }

  return doc
}

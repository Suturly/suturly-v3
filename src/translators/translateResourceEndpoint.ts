import type { Endpoint, PayloadHandler } from 'payload'

import { translateOperation } from '@/translators/contentTranslator/translateOperation'
import { isLocalePublished } from '@/utilities/localePublishStatus'

/**
 * POST /api/posts/:id/translate-to-es
 *
 * One-shot endpoint that drives the "Translate all" editor button. The flow:
 *
 *   1. Verify the requester is a logged-in admin user (no anonymous translation).
 *   2. Read the EN locale of the post.
 *   3. Walk every localized text/textarea/richText field via the plugin's
 *      `translateOperation`, calling the configured DeepL resolver (configured
 *      in `src/plugins/index.ts` via payloadContentTranslatorPlugin). We pass
 *      `update: false` so the plugin returns the translated payload without
 *      writing — we want to do the write ourselves so we can ATOMICALLY include
 *      the `translatedAt` stamp and the `skipEnUpdatedAt` context flag.
 *   4. payload.update() the post at the ES locale with the translated content
 *      AND `translatedAt: now`. The `skipEnUpdatedAt` context prevents our own
 *      `trackEnUpdatedAt` afterChange hook from bumping `enUpdatedAt` (which
 *      would immediately mark every Spanish field stale again).
 *
 * On the spec's "no auto-translate on EN save" rule: this endpoint is never
 * called from a save hook — only from the explicit admin button — so EN edits
 * never trigger DeepL.
 *
 * Failure modes return JSON `{ success: false, message }` with appropriate
 * HTTP status so the admin button can show a toast.
 */
const handler: PayloadHandler = async (req) => {
  const id = req.routeParams?.id

  if (!id || (typeof id !== 'string' && typeof id !== 'number')) {
    return Response.json(
      { success: false, message: 'Missing post id in path' },
      { status: 400 },
    )
  }

  if (!req.user) {
    return Response.json(
      { success: false, message: 'You must be logged in to translate.' },
      { status: 401 },
    )
  }

  const resolver = req.payload.config.custom?.translator?.resolver
  if (!resolver) {
    req.payload.logger.error({
      msg: 'translate-to-es: no resolver configured. Check DEEPL_API_KEY in env.',
    })
    return Response.json(
      {
        success: false,
        message: 'Translation is not configured (missing DEEPL_API_KEY).',
      },
      { status: 503 },
    )
  }

  // Snapshot the EN locale (source of truth) and the existing ES doc so the
  // plugin's traverseFields has both halves: it walks EN to collect strings to
  // translate, then writes the translations into a copy of the ES doc that we
  // then persist below.
  const translateResult = await translateOperation({
    id,
    collectionSlug: 'posts',
    locale: 'es',
    localeFrom: 'en',
    emptyOnly: false,
    overrideAccess: false,
    req,
    update: false,
  })

  if (!translateResult.success) {
    return Response.json(
      {
        success: false,
        message:
          'DeepL did not return a successful translation. See server logs for details.',
      },
      { status: 502 },
    )
  }

  try {
    const existing = await req.payload.findByID({
      collection: 'posts',
      id,
      depth: 0,
      draft: true,
      locale: 'en',
      overrideAccess: true,
      req,
    })

    const esDraft = !isLocalePublished(existing?._status, 'es')

    await req.payload.update({
      collection: 'posts',
      id,
      locale: 'es',
      data: {
        ...translateResult.translatedData,
        translatedAt: new Date().toISOString(),
        spanishMirrorsEnglish: false,
        enMirroredFieldPaths: [],
      },
      depth: 0,
      draft: esDraft,
      overrideAccess: false,
      req,
      user: req.user,
      context: { skipEnUpdatedAt: true, skipSpanishMirroringDetect: true, skipEsAutoSync: true },
    })
  } catch (err) {
    req.payload.logger.error({
      msg: 'translate-to-es: persistence failed after a successful DeepL run',
      err: err instanceof Error ? err.message : String(err),
      postId: id,
    })
    return Response.json(
      {
        success: false,
        message:
          'Translation succeeded but persistence failed. Try again or contact a developer.',
      },
      { status: 500 },
    )
  }

  return Response.json({ success: true })
}

export const translateResourceEndpoint: Endpoint = {
  path: '/:id/translate-to-es',
  method: 'post',
  handler,
}

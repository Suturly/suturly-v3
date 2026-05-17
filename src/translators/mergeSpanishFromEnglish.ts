import type { PayloadRequest } from 'payload'

import { translateOperation } from '@/translators/contentTranslator/translateOperation'

import { identityTranslateResolver } from './identityTranslateResolver'

/**
 * Full mirror of localized EN fields into ES (`emptyOnly: false`).
 * Temporarily swaps `config.custom.translator.resolver` for {@link identityTranslateResolver}.
 *
 * Always pass the parent hook **`req`** into nested reads/writes so Postgres stays in one transaction;
 * omitting it caused multi-minute PATCH hangs / 500s (second connection blocked on row locks).
 */
export async function mergeSpanishFromEnglishForPost(
  req: PayloadRequest,
  id: string | number,
  /** Must match parent save: nested updates without `draft: true` re-validate required fields and fail on incomplete drafts. */
  saveOptions?: { draft?: boolean },
): Promise<boolean> {
  const { payload } = req
  const cfg = payload.config as {
    custom?: { translator?: { resolver?: unknown } }
  }
  cfg.custom ??= {}
  cfg.custom.translator ??= {}
  const prevResolver = cfg.custom.translator.resolver
  cfg.custom.translator.resolver = identityTranslateResolver

  try {
    const result = await translateOperation({
      payload,
      req,
      id,
      collectionSlug: 'posts',
      locale: 'es',
      localeFrom: 'en',
      emptyOnly: false,
      update: false,
      overrideAccess: true,
    })

    if (!result.success) {
      payload.logger.warn({ postId: id }, 'mergeSpanishFromEnglish: translateOperation failed')
      return false
    }

    await payload.update({
      collection: 'posts',
      id,
      locale: 'es',
      data: result.translatedData,
      depth: 0,
      draft: saveOptions?.draft,
      overrideAccess: true,
      req,
      context: {
        skipEnUpdatedAt: true,
        skipSpanishMirroringDetect: true,
        skipEsAutoSync: true,
      },
    })
    return true
  } catch (err) {
    payload.logger.error(
      {
        err: err instanceof Error ? err.message : String(err),
        postId: id,
      },
      'mergeSpanishFromEnglish: persistence failed',
    )
    return false
  } finally {
    cfg.custom.translator.resolver = prevResolver
  }
}

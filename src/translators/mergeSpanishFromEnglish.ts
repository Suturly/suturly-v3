import type { PayloadRequest } from 'payload'
import { APIError } from 'payload'

import {
  normalizeEnMirroredFieldPaths,
  readValueAtPath,
  setValueAtPath,
} from '@/utilities/enMirroredFieldPaths'
import { deepCloneForForm } from '@/collections/Resources/components/staleLocalizedShared'

import { translateOperation } from '@/translators/contentTranslator/translateOperation'

import { identityTranslateResolver } from './identityTranslateResolver'

export type MergeSpanishSaveOptions = {
  draft?: boolean
  /** When set, only these Payload form paths are copied EN→ES (partial mirror). */
  fieldPaths?: string[]
  failOnError?: boolean
}

async function persistSpanishData(
  req: PayloadRequest,
  id: string | number,
  data: Record<string, unknown>,
  saveOptions?: MergeSpanishSaveOptions,
): Promise<boolean> {
  try {
    await req.payload.update({
      collection: 'posts',
      id,
      locale: 'es',
      data,
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
    req.payload.logger.error(
      {
        err: err instanceof Error ? err.message : String(err),
        postId: id,
      },
      'mergeSpanishFromEnglish: persistence failed',
    )
    if (saveOptions?.failOnError) {
      throw new APIError(
        err instanceof Error ? err.message : 'Failed to mirror English content into Spanish.',
        500,
      )
    }
    return false
  }
}

/**
 * Copy selected localized EN field paths into ES (identity values, no DeepL).
 */
export async function mergeSpanishFieldPathsFromEnglishForPost(
  req: PayloadRequest,
  id: string | number,
  fieldPaths: string[],
  saveOptions?: MergeSpanishSaveOptions,
): Promise<boolean> {
  const paths = normalizeEnMirroredFieldPaths(fieldPaths)
  if (paths.length === 0) return true

  const draft = saveOptions?.draft ?? true

  const enDoc = (await req.payload.findByID({
    collection: 'posts',
    id,
    locale: 'en',
    draft,
    depth: 0,
    overrideAccess: true,
    req,
  })) as unknown as Record<string, unknown>

  const esDoc = (await req.payload.findByID({
    collection: 'posts',
    id,
    locale: 'es',
    draft,
    depth: 0,
    overrideAccess: true,
    req,
  })) as unknown as Record<string, unknown>

  const merged = deepCloneForForm(esDoc) as Record<string, unknown>

  for (const path of paths) {
    const segments = path.split('.').filter(Boolean)
    const enVal = readValueAtPath(enDoc, segments)
    setValueAtPath(merged, segments, enVal)
  }

  return persistSpanishData(req, id, merged, saveOptions)
}

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
  saveOptions?: MergeSpanishSaveOptions,
): Promise<boolean> {
  const fieldPaths = saveOptions?.fieldPaths
  if (fieldPaths && fieldPaths.length > 0) {
    return mergeSpanishFieldPathsFromEnglishForPost(req, id, fieldPaths, saveOptions)
  }

  const { payload } = req
  const cfg = payload.config as {
    custom?: { translator?: { resolver?: unknown } }
  }
  cfg.custom ??= {}
  cfg.custom.translator ??= {}
  const prevResolver = cfg.custom.translator.resolver
  cfg.custom.translator.resolver = identityTranslateResolver

  const draft = saveOptions?.draft ?? true

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
      if (saveOptions?.failOnError) {
        throw new APIError('Failed to mirror English content into Spanish.', 500)
      }
      return false
    }

    return persistSpanishData(req, id, result.translatedData, saveOptions)
  } catch (err) {
    if (err instanceof APIError) throw err
    payload.logger.error(
      {
        err: err instanceof Error ? err.message : String(err),
        postId: id,
      },
      'mergeSpanishFromEnglish: mirror failed',
    )
    if (saveOptions?.failOnError) {
      throw new APIError(
        err instanceof Error ? err.message : 'Failed to mirror English content into Spanish.',
        500,
      )
    }
    return false
  } finally {
    cfg.custom.translator.resolver = prevResolver
  }
}

/**
 * One-time / occasional: copy English into empty Spanish fields only.
 *
 * Uses the same field walk as "Translate all" (`translateOperation` in `src/translators/contentTranslator`).
 * with `emptyOnly: true`, but swaps the resolver for an identity pass (EN strings unchanged).
 * Does **not** stamp `translatedAt` — editors can still run Translate all (DeepL) or Reset.
 *
 * Requires DATABASE_URL + PAYLOAD_SECRET (same as other scripts).
 *
 *   pnpm exec tsx src/scripts/backfillEmptyEsFromEn.ts
 *   pnpm exec tsx src/scripts/backfillEmptyEsFromEn.ts --dry-run
 *   pnpm exec tsx src/scripts/backfillEmptyEsFromEn.ts --id=42
 *   pnpm exec tsx src/scripts/backfillEmptyEsFromEn.ts --limit=10
 */

import type { TranslateResolver } from '@jhb.software/payload-content-translator-plugin'

import { translateOperation } from '@/translators/contentTranslator/translateOperation'
import config from '@payload-config'
import { getPayload } from 'payload'

const identityResolver: TranslateResolver = {
  key: 'identity-en-to-es-empty-only',
  resolve: async ({ texts }) => ({
    success: true,
    translatedTexts: texts.map((t) => (t == null ? '' : String(t))),
  }),
}

function parseArg(name: string): string | undefined {
  const prefix = `${name}=`
  const raw = process.argv.find((a) => a === name || a.startsWith(prefix))
  if (!raw) return undefined
  if (raw === name) return ''
  return raw.slice(prefix.length)
}

function hasFlag(name: string): boolean {
  return process.argv.includes(name)
}

async function backfillOne(
  payload: Awaited<ReturnType<typeof getPayload>>,
  id: string | number,
  dryRun: boolean,
): Promise<'updated' | 'failed'> {
  try {
    const result = await translateOperation({
      payload,
      id,
      collectionSlug: 'posts',
      locale: 'es',
      localeFrom: 'en',
      emptyOnly: true,
      update: false,
      overrideAccess: true,
    })

    if (!result.success) {
      payload.logger.warn({ msg: '[backfill-es] translateOperation failed', id })
      return 'failed'
    }

    if (dryRun) {
      payload.logger.info({ msg: '[backfill-es] dry-run ok', id })
      return 'updated'
    }

    await payload.update({
      collection: 'posts',
      id,
      locale: 'es',
      data: result.translatedData,
      depth: 0,
      overrideAccess: true,
      context: { skipEnUpdatedAt: true, skipSpanishMirroringDetect: true },
    })
    return 'updated'
  } catch (err) {
    payload.logger.error({
      msg: '[backfill-es] error',
      id,
      err: err instanceof Error ? err.message : String(err),
    })
    return 'failed'
  }
}

async function main() {
  const dryRun = hasFlag('--dry-run')
  const limitRaw = parseArg('--limit')
  const idRaw = parseArg('--id')
  let limit: number | undefined
  if (limitRaw === undefined || limitRaw === '') {
    limit = undefined
  } else {
    const parsed = Number.parseInt(limitRaw, 10)
    if (Number.isNaN(parsed) || parsed < 1) {
      console.error('[backfill-es] Invalid --limit')
      process.exit(1)
    }
    limit = parsed
  }

  const payload = await getPayload({ config })

  const cfg = payload.config as {
    custom?: { translator?: { resolver?: unknown } }
  }
  cfg.custom ??= {}
  cfg.custom.translator ??= {}
  const prevResolver = cfg.custom.translator.resolver
  cfg.custom.translator.resolver = identityResolver

  try {
    if (idRaw !== undefined) {
      const id =
        typeof idRaw === 'string' && /^\d+$/.test(idRaw) ? Number.parseInt(idRaw, 10) : idRaw
      if (id === '' || id === undefined) {
        console.error('[backfill-es] Use --id=123 or --id=slug (numeric id expected for posts)')
        process.exit(1)
      }
      const outcome = await backfillOne(payload, id as string | number, dryRun)
      payload.logger.info({
        msg: '[backfill-es] single id done',
        id,
        dryRun,
        outcome,
      })
      process.exit(outcome === 'failed' ? 1 : 0)
    }

    const findLimit = limit ?? 10000
    const posts = await payload.find({
      collection: 'posts',
      limit: findLimit,
      pagination: false,
      depth: 0,
      overrideAccess: true,
    })

    let updated = 0
    let failed = 0

    for (const doc of posts.docs) {
      const outcome = await backfillOne(payload, doc.id, dryRun)
      if (outcome === 'updated') updated += 1
      if (outcome === 'failed') failed += 1
    }

    payload.logger.info({
      msg: '[backfill-es] Done',
      total: posts.docs.length,
      updated,
      failed,
      dryRun,
      limit: limit ?? null,
    })
    process.exit(failed > 0 ? 1 : 0)
  } finally {
    cfg.custom.translator.resolver = prevResolver
  }
}

main().catch((error) => {
  console.error('[backfill-es] Fatal:', error)
  process.exit(1)
})

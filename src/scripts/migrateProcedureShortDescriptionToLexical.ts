/**
 * One-time: persist legacy plain-string `procedureTypeCard.shortDescription` values
 * as Lexical JSON for every Resource (posts collection).
 *
 * Hooks migrate in memory on read/save, but the DB still held strings until each
 * doc was saved. This script writes the fixed `content` for all documents.
 *
 * Usage (from repo root, with DATABASE_URL + PAYLOAD_SECRET in env):
 *   pnpm exec tsx src/scripts/migrateProcedureShortDescriptionToLexical.ts
 *
 * Dry run (no writes):
 *   MIGRATION_DRY_RUN=true pnpm exec tsx src/scripts/migrateProcedureShortDescriptionToLexical.ts
 */
import config from '@payload-config'
import { getPayload } from 'payload'

import type { Post } from '@/payload-types'

import { migrateLegacyProcedureShortDescriptionStrings } from '@/utilities/migrateLegacyProcedureShortDescription'

const isDryRun = () => process.env.MIGRATION_DRY_RUN?.toLowerCase() === 'true'

async function migrateBatch(
  payload: Awaited<ReturnType<typeof getPayload>>,
  draft: boolean,
): Promise<{ docsScanned: number; docsUpdated: number; fieldsConverted: number }> {
  let page = 1
  const limit = 100
  let docsScanned = 0
  let docsUpdated = 0
  let fieldsConverted = 0

  while (true) {
    const result = await payload.find({
      collection: 'posts',
      depth: 0,
      page,
      limit,
      overrideAccess: true,
      draft,
      pagination: true,
    })

    if (!result.docs.length) break

    for (const doc of result.docs) {
      docsScanned += 1
      const data = doc as Post
      const converted = migrateLegacyProcedureShortDescriptionStrings(data)
      if (converted === 0) continue

      fieldsConverted += converted
      docsUpdated += 1

      if (isDryRun()) {
        payload.logger.info(
          `[procedure-shortdesc-migrate] DRY_RUN would update id=${data.id} draft=${draft} fields=${converted}`,
        )
        continue
      }

      await payload.update({
        collection: 'posts',
        id: data.id,
        data: {
          categorySections: data.categorySections ?? undefined,
        } satisfies Partial<Post>,
        overrideAccess: true,
        draft,
        context: {
          disableRevalidate: true,
        },
      })

      payload.logger.info(
        `[procedure-shortdesc-migrate] Updated id=${data.id} draft=${draft} fields=${converted}`,
      )
    }

    if (!result.hasNextPage) break
    page += 1
  }

  return { docsScanned, docsUpdated, fieldsConverted }
}

async function main() {
  const payload = await getPayload({ config })
  const dry = isDryRun()

  payload.logger.info(
    `[procedure-shortdesc-migrate] Starting (dryRun=${dry}). Published batch, then draft batch.`,
  )

  const published = await migrateBatch(payload, false)
  const draft = await migrateBatch(payload, true)

  const totalScanned = published.docsScanned + draft.docsScanned
  const totalUpdated = published.docsUpdated + draft.docsUpdated
  const totalFields = published.fieldsConverted + draft.fieldsConverted

  payload.logger.info(
    `[procedure-shortdesc-migrate] Done. scanned=${totalScanned} updated=${totalUpdated} fieldsConverted=${totalFields} (published: ${published.docsUpdated}/${published.docsScanned}, draft: ${draft.docsUpdated}/${draft.docsScanned})`,
  )

  process.exit(0)
}

main().catch((error) => {
  console.error('[procedure-shortdesc-migrate] Failed:', error)
  process.exit(1)
})

import type { CollectionAfterOperationHook } from 'payload'
import { createLocalReq } from 'payload'

import type { Post } from '@/payload-types'

const nz = (s: unknown): string => (typeof s === 'string' ? s.trim() : '')

/**
 * Spanish admin **list** uses `enableListViewSelectAPI`: rows arrive as plain scalars per locale, not
 * `{ en, es }` blobs, so Payload read fallback never substitutes EN for empty ES title/slug.
 * Batch-load EN title/slug for affected ids (one extra query per page).
 */
export const mergeEnglishListColumnsAfterFind: CollectionAfterOperationHook<'posts'> = async ({
  operation,
  req,
  result,
  args,
}) => {
  if (operation !== 'find') return result
  if (!req.user || req.locale !== 'es') return result

  const docs = result.docs as Post[]
  if (!Array.isArray(docs) || docs.length === 0) return result

  const ids: number[] = []
  const seen = new Set<number>()
  for (const doc of docs) {
    if (doc.spanishMirrorsEnglish === false) continue
    if (nz(doc.title) && nz(doc.slug)) continue
    const id = typeof doc.id === 'number' ? doc.id : Number(doc.id)
    if (!Number.isFinite(id) || seen.has(id)) continue
    seen.add(id)
    ids.push(id)
  }

  if (ids.length === 0) return result

  try {
    const enReq = await createLocalReq({ locale: 'en', user: req.user }, req.payload)
    const enResult = await req.payload.find({
      collection: 'posts',
      draft: args.draft,
      depth: 0,
      limit: ids.length,
      overrideAccess: true,
      pagination: false,
      req: enReq,
      select: {
        slug: true,
        title: true,
      },
      where: {
        id: {
          in: ids,
        },
      },
    })

    const enById = new Map<number, Pick<Post, 'slug' | 'title'>>()
    for (const row of enResult.docs as Post[]) {
      const id = typeof row.id === 'number' ? row.id : Number(row.id)
      if (Number.isFinite(id)) enById.set(id, { slug: row.slug, title: row.title })
    }

    result.docs = docs.map((doc) => {
      if (doc.spanishMirrorsEnglish === false) return doc
      const id = typeof doc.id === 'number' ? doc.id : Number(doc.id)
      if (!Number.isFinite(id)) return doc

      const en = enById.get(id)
      if (!en) return doc

      let next = doc
      if (!nz(doc.title) && nz(en.title)) {
        next = { ...next, title: en.title }
      }
      if (!nz(doc.slug) && nz(en.slug)) {
        next = { ...next, slug: en.slug }
      }
      return next
    })
  } catch {
    // Leave list rows unchanged if EN merge fails.
  }

  return result
}

import type { Payload } from 'payload'

import type { Post } from '@/payload-types'

export async function ensureMedia(payload: Payload, value: unknown): Promise<unknown> {
  if (value == null || value === '') return value
  if (typeof value === 'object' && value !== null && 'url' in value) return value

  const id =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && /^\d+$/.test(value)
        ? Number(value)
        : null

  if (id == null) return value

  try {
    return await payload.findByID({ collection: 'media', id, depth: 0 })
  } catch {
    return value
  }
}

async function ensureCategory(payload: Payload, value: unknown): Promise<unknown> {
  if (value == null || value === '') return value
  if (typeof value === 'object' && value !== null && 'slug' in value) return value

  const id =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && /^\d+$/.test(value)
        ? Number(value)
        : null

  if (id == null) return value

  try {
    return await payload.findByID({ collection: 'categories', id, depth: 0 })
  } catch {
    return value
  }
}

/**
 * Loads upload/category relationships without using Payload `depth` population on `posts`,
 * which can trigger Drizzle bugs during draft preview (populated media objects passed where
 * scalar IDs are expected). Call after `find` / `findByID` with `depth: 0`.
 */
export async function hydratePostRelations(payload: Payload, doc: Post): Promise<Post> {
  const next = { ...doc }

  next.coverImage = (await ensureMedia(payload, next.coverImage)) as Post['coverImage']

  if (Array.isArray(next.benefits)) {
    next.benefits = await Promise.all(
      next.benefits.map(async (row) => {
        if (!row || typeof row !== 'object') return row
        return {
          ...row,
          icon: (await ensureMedia(payload, row.icon)) as typeof row.icon,
        }
      }),
    )
  }

  if (Array.isArray(next.categorySections)) {
    next.categorySections = await Promise.all(
      next.categorySections.map(async (sec) => {
        if (!sec || typeof sec !== 'object') return sec
        return {
          ...sec,
          category: (await ensureCategory(payload, sec.category)) as typeof sec.category,
        }
      }),
    )
  }

  if (next.meta && typeof next.meta === 'object') {
    next.meta = {
      ...next.meta,
      image: (await ensureMedia(payload, next.meta.image)) as typeof next.meta.image,
    }
  }

  return next
}

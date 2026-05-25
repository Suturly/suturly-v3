import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

import type { Payload } from 'payload'
import type { Post } from '../../../payload-types'
import {
  anyLocalePublished,
  localeStatusChanged,
} from '@/utilities/localePublishStatus'

const listPaths = ['/resources', '/posts', '/es/resources', '/es/posts']

const slugToPathSegment = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null

/** Invalidate every ISR surface for a Resource, including prefixed `/es/` URLs. */
function revalidateSlugSurfaces(slugs: Iterable<string>): void {
  for (const raw of slugs) {
    const segment = slugToPathSegment(raw)
    if (!segment) continue
    const enc = encodeURIComponent(segment)
    revalidatePath(`/resources/${enc}`)
    revalidatePath(`/posts/${enc}`)
    revalidatePath(`/es/resources/${enc}`)
    revalidatePath(`/es/posts/${enc}`)
  }
}

async function collectSlugsAroundChange(
  payload: Payload,
  id: number,
  docSlug?: unknown,
  previousSlug?: unknown,
): Promise<string[]> {
  const out = new Set<string>()
  const add = (value: unknown) => {
    const s = slugToPathSegment(value)
    if (s) out.add(s)
  }

  add(docSlug)
  add(previousSlug)

  try {
    const en = await payload.findByID({
      collection: 'posts',
      id,
      depth: 0,
      draft: false,
      locale: 'en',
      overrideAccess: true,
    })
    add((en as Post | undefined)?.slug)
  } catch {
    /* findByID fails mid-delete — ignored */
  }

  try {
    const es = await payload.findByID({
      collection: 'posts',
      id,
      depth: 0,
      draft: false,
      locale: 'es',
      overrideAccess: true,
    })
    add((es as Post | undefined)?.slug)
  } catch {
    /* ignored */
  }

  return [...out]
}

function shouldRevalidateForPublishChange(doc: Post, previousDoc?: Post): boolean {
  if (anyLocalePublished(doc._status)) return true
  if (previousDoc && anyLocalePublished(previousDoc._status)) return true
  if (localeStatusChanged(previousDoc?._status, doc._status, 'en')) return true
  if (localeStatusChanged(previousDoc?._status, doc._status, 'es')) return true
  return false
}

export const revalidatePost: CollectionAfterChangeHook<Post> = async ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (context.disableRevalidate) return doc

  if (shouldRevalidateForPublishChange(doc, previousDoc ?? undefined)) {
    payload.logger.info(`Revalidating post id=${doc.id} (published paths + lists)`)

    const slugs = await collectSlugsAroundChange(payload, doc.id, doc.slug, previousDoc?.slug)
    revalidateSlugSurfaces(slugs)
    listPaths.forEach((p) => revalidatePath(p))
    revalidateTag('posts-sitemap')
  }

  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Post> = async ({
  doc,
  req: { payload, context },
}) => {
  if (context.disableRevalidate) return doc

  const id = typeof doc?.id === 'number' ? doc.id : null
  if (id !== null) {
    payload.logger.info(`Revalidating deleted post id=${id}`)
    const slugs = await collectSlugsAroundChange(payload, id, doc.slug, undefined)
    revalidateSlugSurfaces(slugs)
  }

  listPaths.forEach((p) => revalidatePath(p))
  revalidateTag('posts-sitemap')

  return doc
}

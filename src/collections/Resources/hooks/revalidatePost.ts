import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { revalidatePath, revalidateTag } from 'next/cache'

import type { Post } from '../../../payload-types'

export const revalidatePost: CollectionAfterChangeHook<Post> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  const listPaths = ['/resources', '/posts']

  if (!context.disableRevalidate) {
    if (doc._status === 'published') {
      const path = `/resources/${doc.slug}`

      payload.logger.info(`Revalidating post at path: ${path}`)

      revalidatePath(path)
      listPaths.forEach((listPath) => revalidatePath(listPath))
      revalidateTag('posts-sitemap')
    }

    // If the post was previously published, we need to revalidate the old path
    if (previousDoc?._status === 'published' && doc._status !== 'published') {
      const oldPath = `/resources/${previousDoc.slug}`

      payload.logger.info(`Revalidating old post at path: ${oldPath}`)

      revalidatePath(oldPath)
      listPaths.forEach((listPath) => revalidatePath(listPath))
      revalidateTag('posts-sitemap')
    }

    // Keep list pages fresh when editing already published docs.
    if (doc._status === 'published' && previousDoc?._status === 'published') {
      listPaths.forEach((listPath) => revalidatePath(listPath))
    }
  }
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Post> = ({ doc, req: { context } }) => {
  if (!context.disableRevalidate) {
    const path = `/resources/${doc?.slug}`

    revalidatePath(path)
    revalidatePath('/resources')
    revalidatePath('/posts')
    revalidateTag('posts-sitemap')
  }

  return doc
}

import type { Metadata } from 'next/types'

import { CollectionArchive } from '@/components/CollectionArchive'
import { PageRange } from '@/components/PageRange'
import { Pagination } from '@/components/Pagination'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import PageClient from './page.client'
import { getRequestLocale } from '@/utilities/requestLocale'

export const revalidate = 600

export default async function Page() {
  const locale = await getRequestLocale()
  const pathnamePrefix = locale === 'es' ? '/es' : ''
  const localePrefix: '' | '/es' = locale === 'es' ? '/es' : ''
  const payload = await getPayload({ config: configPromise })

  const posts = await payload.find({
    collection: 'posts',
    depth: 1,
    limit: 12,
    overrideAccess: false,
    locale,
    select: {
      title: true,
      slug: true,
      meta: true,
    },
  })

  return (
    <div className="pt-24 pb-24">
      <PageClient />
      <div className="container mb-16">
        <div className="prose dark:prose-invert max-w-none">
          <h1>Posts</h1>
        </div>
      </div>

      <div className="container mb-8">
        <PageRange
          collection="posts"
          currentPage={posts.page}
          limit={12}
          totalDocs={posts.totalDocs}
        />
      </div>

      <CollectionArchive localePrefix={localePrefix} posts={posts.docs} />

      <div className="container">
        {posts.totalPages > 1 && posts.page && (
          <Pagination page={posts.page} pathnamePrefix={pathnamePrefix} totalPages={posts.totalPages} />
        )}
      </div>
    </div>
  )
}

export function generateMetadata(): Metadata {
  return {
    title: `Payload Website Template Posts`,
  }
}

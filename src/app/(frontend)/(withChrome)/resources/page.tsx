import type { Metadata } from 'next'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import {
  ResourcesListingWithFilters,
  type ResourceCardForListing,
} from './ResourcesListingWithFilters'
import { getRequestLocale } from '@/utilities/requestLocale'

export const metadata: Metadata = {
  title: 'Resources',
  description: 'Explore practical resources and chapter guides.',
}

type ResourceCardItem = ResourceCardForListing

export const revalidate = 600

export default async function ResourcesPage() {
  const locale = await getRequestLocale()
  const payload = await getPayload({ config: configPromise })

  const resources = await payload.find({
    collection: 'posts',
    depth: 1,
    limit: 100,
    pagination: false,
    overrideAccess: false,
    draft: false,
    locale,
    where: {
      _status: {
        equals: 'published',
      },
    },
    sort: '-updatedAt',
    select: {
      title: true,
      slug: true,
      coverImage: true,
      benefits: true,
      specialties: true,
    },
  })

  let docs = resources.docs ?? []

  // ES locale rows may lack localized title/slug until Translate/backfill/mirror. Use EN values for
  // listing cards so links target real URLs; detail page resolves ES doc by EN slug fallback.
  if (locale === 'es' && docs.length > 0) {
    const idsNeedingEnFields = [
      ...new Set(
        docs
          .filter(
            (d) =>
              !(d.title ?? '').toString().trim() ||
              !(d.slug ?? '').toString().trim(),
          )
          .map((d) => d.id),
      ),
    ]
    if (idsNeedingEnFields.length > 0) {
      const enDocs = await payload.find({
        collection: 'posts',
        depth: 0,
        draft: false,
        limit: idsNeedingEnFields.length,
        pagination: false,
        locale: 'en',
        overrideAccess: false,
        where: {
          and: [{ id: { in: idsNeedingEnFields } }, { _status: { equals: 'published' } }],
        },
        select: { id: true, title: true, slug: true },
      })
      const enById = new Map<number, { title?: string; slug?: string }>()
      for (const d of enDocs.docs) {
        enById.set(d.id, {
          title: (d.title ?? '').toString().trim(),
          slug: (d.slug ?? '').toString().trim(),
        })
      }
      docs = docs.map((doc) => {
        const fb = enById.get(doc.id)
        if (!fb) return doc
        const title =
          (doc.title ?? '').toString().trim() || fb.title || doc.title
        const slug =
          (doc.slug ?? '').toString().trim() || fb.slug || doc.slug
        return { ...doc, title, slug }
      })
    }
  }

  const cards: ResourceCardItem[] = docs.filter(
    (doc) =>
      Boolean((doc.title ?? '').toString().trim()) &&
      Boolean((doc.slug ?? '').toString().trim()),
  ) as ResourceCardItem[]

  return (
    <main className="resources-page py-20 md:py-28">
      <section className="container">
        <div className="resources-page__header max-w-3xl space-y-6">
          <h1 className="resource-page__title text-h1 font-semibold">
            Explore available resources
          </h1>
        </div>

        {cards.length > 0 && (
          <ResourcesListingWithFilters cards={cards} locale={locale} />
        )}
      </section>
    </main>
  )
}

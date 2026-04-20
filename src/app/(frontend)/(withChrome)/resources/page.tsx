import type { Metadata } from 'next'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import { ResourcesListingWithFilters, type ResourceCardForListing } from './ResourcesListingWithFilters'

export const metadata: Metadata = {
  title: 'Resources',
  description: 'Explore practical resources and chapter guides.',
}

type ResourceCardItem = ResourceCardForListing

export const revalidate = 600

export default async function ResourcesPage() {
  const payload = await getPayload({ config: configPromise })

  const resources = await payload.find({
    collection: 'posts',
    depth: 1,
    limit: 100,
    pagination: false,
    overrideAccess: false,
    draft: false,
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

  const cards: ResourceCardItem[] = (resources.docs ?? []) as ResourceCardItem[]

  return (
    <main className="resources-page py-20 md:py-28">
      <section className="container">
        <div className="resources-page__header max-w-3xl space-y-6">
          <h1 className="resource-page__title text-h1 font-semibold">
            Explore available resources
          </h1>
        </div>

        {cards.length > 0 && <ResourcesListingWithFilters cards={cards} />}
      </section>
    </main>
  )
}

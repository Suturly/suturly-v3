import type { Metadata } from 'next'
import type { Post } from '@/payload-types'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import Link from 'next/link'
import React from 'react'
import { BenefitTagsInline } from './BenefitTagsInline'
import { Media } from '@/components/Media'

export const metadata: Metadata = {
  title: 'Resources',
  description: 'Explore practical resources and chapter guides.',
}

type ResourceCardItem = Pick<Post, 'id' | 'title' | 'slug' | 'coverImage' | 'benefits'>

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
    },
  })

  const cards: ResourceCardItem[] = (resources.docs ?? []) as ResourceCardItem[]

  return (
    <main className="resources-page py-20 md:py-28">
      <section className="container">
        <div className="resources-page__header max-w-3xl space-y-6">
          <h1 className="resource-page__title text-h1 font-semibold">
            Explore all available resources
          </h1>
        </div>

        {cards.length > 0 && (
          <div className="resources-grid">
            {cards.map((card) => {
              const coverImage = typeof card.coverImage === 'object' ? card.coverImage : null
              const benefitTags = (card.benefits ?? [])
                .map((benefit) => ({
                  text: benefit?.description?.trim() || '',
                  icon: typeof benefit?.icon === 'object' ? benefit.icon : null,
                }))
                .filter((benefit) => Boolean(benefit.text))

              return (
                <Link className="resource-card" href={`/resources/${card.slug}`} key={card.id}>
                  <div className="resource-card__media-wrap">
                    {coverImage ? (
                      <Media
                        className="resource-card__media"
                        imgClassName="resource-card__media-image"
                        fill
                        resource={coverImage}
                        size="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="resource-card__media-fallback" />
                    )}
                  </div>
                  <div className="resource-card__content">
                    <h2 className="resource-card__title">{card.title}</h2>
                    {benefitTags.length > 0 && <BenefitTagsInline tags={benefitTags} />}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}

'use client'

import type { Post } from '@/payload-types'
import { Media } from '@/components/Media'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/utilities/ui'
import Link from 'next/link'
import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { BenefitTagsInline } from './BenefitTagsInline'
import {
  RESOURCE_LISTING_SPECIALTY_FILTERS,
  type ResourceListingFilterId,
} from './resourceSpecialtyFilters'

export type ResourceCardForListing = Pick<
  Post,
  'id' | 'title' | 'slug' | 'coverImage' | 'benefits' | 'specialties'
>

type Props = {
  cards: ResourceCardForListing[]
}

/** 10% fade on trailing edge — at scroll start, more content on the right. */
const MASK_FADE_END = 'linear-gradient(to right, #000 0%, #000 90%, transparent 100%)'
/** 10% fade on leading edge — at scroll end, more content on the left. */
const MASK_FADE_START = 'linear-gradient(to right, transparent 0%, #000 10%, #000 100%)'
/** 10% fade on both edges — mid-scroll. */
const MASK_FADE_BOTH =
  'linear-gradient(to right, transparent 0%, #000 10%, #000 90%, transparent 100%)'
const MASK_FULL = 'linear-gradient(to right, #000 0%, #000 100%)'

function computeFiltersMask(el: HTMLDivElement | null): string {
  if (!el) return MASK_FULL
  const { scrollLeft, scrollWidth, clientWidth } = el
  if (scrollWidth <= clientWidth + 2) return MASK_FULL
  const atStart = scrollLeft <= 2
  const atEnd = scrollLeft + clientWidth >= scrollWidth - 2
  if (atStart && atEnd) return MASK_FULL
  if (atStart) return MASK_FADE_END
  if (atEnd) return MASK_FADE_START
  return MASK_FADE_BOTH
}

export function ResourcesListingWithFilters({ cards }: Props) {
  const [active, setActive] = useState<ResourceListingFilterId>('all')
  const scrollRef = useRef<HTMLDivElement>(null)
  const [mask, setMask] = useState(MASK_FULL)

  const updateMask = useCallback(() => {
    setMask(computeFiltersMask(scrollRef.current))
  }, [])

  const filtered = useMemo(() => {
    if (active === 'all') return cards
    return cards.filter((card) => (card.specialties ?? []).includes(active))
  }, [active, cards])

  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return

    updateMask()
    const ro = new ResizeObserver(() => updateMask())
    ro.observe(el)
    el.addEventListener('scroll', updateMask, { passive: true })

    return () => {
      ro.disconnect()
      el.removeEventListener('scroll', updateMask)
    }
  }, [updateMask, cards.length])

  if (cards.length === 0) return null

  const scrollStyle = {
    '--resources-filters-mask': mask,
  } as React.CSSProperties

  return (
    <>
      <div className="resources-page__filters-outer">
        <div
          ref={scrollRef}
          className="resources-page__filters-scroll"
          role="toolbar"
          aria-label="Filter resources by specialty"
          style={scrollStyle}
        >
          <div className="resources-page__filters-track">
            {active === 'all' ? (
              <span
                className={cn(buttonVariants({ variant: 'default', size: 'small' }), 'shrink-0')}
                aria-current="true"
              >
                Show all
              </span>
            ) : (
              <Button
                className="shrink-0"
                variant="outline"
                size="small"
                type="button"
                onClick={() => setActive('all')}
              >
                Show all
              </Button>
            )}
            {RESOURCE_LISTING_SPECIALTY_FILTERS.map(({ id, label }) => {
              const isSelected = active === id
              if (isSelected) {
                return (
                  <span
                    key={id}
                    className={cn(buttonVariants({ variant: 'default', size: 'small' }), 'shrink-0')}
                    aria-current="true"
                  >
                    {label}
                  </span>
                )
              }
              return (
                <Button
                  key={id}
                  className="shrink-0"
                  variant="outline"
                  size="small"
                  type="button"
                  onClick={() => setActive(id)}
                >
                  {label}
                </Button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="resources-grid">
        {filtered.map((card, cardIndex) => {
          const coverImage = typeof card.coverImage === 'object' ? card.coverImage : null
          const benefitTags = (card.benefits ?? [])
            .map((benefit) => ({
              text: benefit?.description?.trim() || '',
              icon: typeof benefit?.icon === 'object' ? benefit.icon : null,
            }))
            .filter((benefit) => Boolean(benefit.text))

          return (
            <Link
              className="resource-card"
              href={`/resources/${card.slug}`}
              key={`resource-card-${card.id}-${cardIndex}`}
            >
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
    </>
  )
}

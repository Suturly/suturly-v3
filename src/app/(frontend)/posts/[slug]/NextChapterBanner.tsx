import { Button } from '@/components/ui/button'
import Link from 'next/link'
import React from 'react'

type Props = {
  ctaLabel: string
  description?: string
  href: string
  title?: string
}

export const NextChapterBanner: React.FC<Props> = ({ ctaLabel, description, href, title }) => {
  return (
    <section className="resource-next-step-banner">
      <div className="resource-next-step-banner__icon" aria-hidden>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4.16602 15L9.16602 10L4.16602 5M10.8327 15L15.8327 10L10.8327 5" stroke="#005764" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>

      </div>
      <div className="resource-next-step-banner__content">
        {title ? <h5 className="resource-next-step-banner__title">{title}</h5> : null}
        {description ? <p className="resource-next-step-banner__description">{description}</p> : null}
      </div>
      <Button asChild className="resource-next-step-banner__action" size="big">
        <Link href={href}>{ctaLabel}</Link>
      </Button>
    </section>
  )
}

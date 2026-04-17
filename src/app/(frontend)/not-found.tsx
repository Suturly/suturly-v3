import type { Metadata } from 'next'

import { MarketingSiteHeader } from '@/components/marketing/MarketingSiteHeader'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Page not found — Suturly',
  description: "The page you're looking for has moved or no longer exists.",
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <div className="marketing-site marketing-not-found-page">
      <MarketingSiteHeader />
      <main className="marketing-not-found" aria-labelledby="not-found-heading">
        <div className="marketing-not-found__inner">
          <p className="h5 marketing-not-found__numerals" aria-hidden>
            404
          </p>
          <h1 id="not-found-heading" className="h3 marketing-not-found__title">
            We couldn’t find the page you were looking for — let’s get you back on track.
          </h1>
          <Button href="/" variant="default" className="marketing-not-found__cta">
            Home page
          </Button>
        </div>
      </main>
    </div>
  )
}

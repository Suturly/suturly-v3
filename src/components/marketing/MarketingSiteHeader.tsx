import { Button } from '@/components/ui/button'
import { Logo } from '@/components/Logo/Logo'
import Link from 'next/link'

export function MarketingSiteHeader() {
  return (
    <header className="marketing-site-header">
      <div className="section">
        <div className="container">
          <div className="row">
            <div className="col col-xs-12 col-lg-12">
              <div className="marketing-site-header__inner">
                <div className="marketing-site-header__left">
                  <Link href="/home" className="marketing-site-header__logo">
                    <Logo loading="eager" priority="high" />
                  </Link>
                  <nav className="marketing-site-header__nav" aria-label="Marketing">
                    <Link className="marketing-site-header__link" href="/resources">
                      Resources
                    </Link>
                    <Link className="marketing-site-header__link" href="/home#how-it-works">
                      How it works
                    </Link>
                    <Link className="marketing-site-header__link" href="/about">
                      About
                    </Link>
                  </nav>
                </div>
                <div className="marketing-site-header__actions">
                  <span className="marketing-site-header__cta-secondary-wrap">
                    <Button asChild variant="outline" size="small">
                      <Link href="/resources">Browse library</Link>
                    </Button>
                  </span>
                  <Button asChild size="small">
                    <Link href="/resources">Get started</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

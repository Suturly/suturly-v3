'use client'

import { PartnerContactOpenButton } from '@/components/marketing/partnerContactModal'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/Logo/Logo'
import { cn } from '@/utilities/ui'
import { Menu, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const NAV_LINKS = [
  { href: '/#platform', label: 'Platform' },
  { href: '/#how-it-works', label: 'How It Works' },
  { href: '/#security', label: 'Security' },
  { href: '/#evidence', label: 'Evidence based' },
] as const

const PANEL_ID = 'marketing-site-nav-panel'

const SCROLL_TOP_THRESHOLD_PX = 100

export function MarketingSiteHeader() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const [activeHash, setActiveHash] = useState<string | null>(null)

  useEffect(() => {
    setIsMenuOpen(false)
    setScrollY(typeof window !== 'undefined' ? window.scrollY : 0)
  }, [pathname])

  // Scroll-spy: track which anchor section is currently in view on the home page.
  useEffect(() => {
    if (pathname !== '/') {
      setActiveHash(null)
      return
    }

    const ids = NAV_LINKS.map((l) => l.href.replace(/^\/#/, ''))
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)

    if (sections.length === 0) return

    const ratios = new Map<string, number>()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0)
        }
        let bestId: string | null = null
        let bestRatio = 0
        for (const [id, ratio] of ratios) {
          if (ratio > bestRatio) {
            bestId = id
            bestRatio = ratio
          }
        }
        setActiveHash(bestId)
      },
      { rootMargin: '-30% 0px -50% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] },
    )

    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [pathname])

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const isTop = scrollY <= SCROLL_TOP_THRESHOLD_PX
  const isActive = scrollY > SCROLL_TOP_THRESHOLD_PX

  useEffect(() => {
    if (!isMenuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isMenuOpen])

  useEffect(() => {
    if (typeof document === 'undefined') return
    if (isMenuOpen) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prev
      }
    }
    return undefined
  }, [isMenuOpen])

  const closeMenu = () => setIsMenuOpen(false)

  return (
    <header
      className={cn('marketing-site-header', isActive && 'is-active')}
      data-menu-open={isMenuOpen ? 'true' : undefined}
    >
      {isMenuOpen ? (
        <button
          type="button"
          className="marketing-site-header__backdrop"
          aria-label="Close menu"
          onClick={closeMenu}
        />
      ) : null}
      <div className={cn('section', 'for-header', isTop && 'is-top')}>
        <div className="container">
          <div className="row">
            <div className="col col-xs-12 col-lg-12">
              <div className="marketing-site-header__shell">
                <div className="marketing-site-header__inner">
                  <Link href="/" className="marketing-site-header__logo">
                    <Logo loading="eager" priority="high" />
                  </Link>

                  <nav
                    className="marketing-site-header__nav u-lg-only u-d-flex"
                    aria-label="Primary"
                  >
                    {NAV_LINKS.map((item) => {
                      const id = item.href.replace(/^\/#/, '')
                      const isCurrent = activeHash === id
                      return (
                        <Link
                          key={item.href}
                          className="marketing-site-header__link"
                          href={item.href}
                          aria-current={isCurrent ? 'true' : undefined}
                        >
                          {item.label}
                        </Link>
                      )
                    })}
                  </nav>

                  <div className="marketing-site-header__actions u-lg-only u-d-inline-flex">
                    {/* <Button
                      type="button"
                      variant="secondary"
                      size="default"
                      className="marketing-site-header__btn-researchers"
                    >
                      For researchers
                    </Button> */}
                    <PartnerContactOpenButton size="default">Get in touch</PartnerContactOpenButton>
                  </div>

                  <div className="marketing-site-header__mobile-bar u-lg-hide u-d-inline-flex">
                    {isMenuOpen ? null : (
                      <PartnerContactOpenButton
                        size="default"
                        className="marketing-site-header__top-cta"
                      >
                        Get in touch
                      </PartnerContactOpenButton>
                    )}
                    <button
                      type="button"
                      className="marketing-site-header__burger"
                      aria-expanded={isMenuOpen}
                      aria-controls={PANEL_ID}
                      aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                      onClick={() => setIsMenuOpen((o) => !o)}
                    >
                      {isMenuOpen ? <X aria-hidden className="marketing-site-header__burger-icon" /> : <Menu aria-hidden className="marketing-site-header__burger-icon" />}
                    </button>
                  </div>
                </div>

                <div
                  id={PANEL_ID}
                  className="marketing-site-header__drawer-outer u-lg-hide"
                  data-state={isMenuOpen ? 'open' : 'closed'}
                  aria-hidden={!isMenuOpen}
                >
                  <div className="marketing-site-header__drawer-inner">
                    <nav className="marketing-site-header__nav-drawer" aria-label="Primary">
                      {NAV_LINKS.map((item) => {
                        const id = item.href.replace(/^\/#/, '')
                        const isCurrent = activeHash === id
                        return (
                          <Link
                            key={item.href}
                            className="marketing-site-header__link marketing-site-header__link--stacked"
                            href={item.href}
                            aria-current={isCurrent ? 'true' : undefined}
                            onClick={closeMenu}
                          >
                            {item.label}
                          </Link>
                        )
                      })}
                    </nav>
                    <div className="marketing-site-header__drawer-actions">
                      <Button
                        type="button"
                        variant="secondary"
                        size="default"
                        className="marketing-site-header__btn-researchers"
                      >
                        For researchers
                      </Button>
                      <PartnerContactOpenButton size="default">Get in touch</PartnerContactOpenButton>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

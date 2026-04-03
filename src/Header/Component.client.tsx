'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import { cn } from '@/utilities/ui'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useMemo, useState } from 'react'

import type { Header } from '@/payload-types'

import { Button } from '@/components/ui/button'
import { Logo } from '@/components/Logo/Logo'

interface HeaderClientProps {
  data: Header
}

/** Single resource article: `/resources/slug` or `/posts/slug` (not listings or `/posts/page/2`). */
function isResourceArticlePath(pathname: string | null): boolean {
  if (!pathname) return false
  const normalized = pathname.replace(/\/$/, '') || '/'
  if (normalized.startsWith('/resources/')) {
    const slug = normalized.slice('/resources/'.length)
    return Boolean(slug && !slug.includes('/'))
  }
  if (normalized.startsWith('/posts/')) {
    const rest = normalized.slice('/posts/'.length)
    if (!rest || rest.startsWith('page/')) return false
    return !rest.includes('/')
  }
  return false
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ data: _data }) => {
  /* Storing the value in a useState to avoid hydration errors */
  const [theme, setTheme] = useState<string | null>(null)
  const { headerTheme, setHeaderTheme } = useHeaderTheme()
  const pathname = usePathname()
  const isResourceArticlePage = useMemo(() => isResourceArticlePath(pathname), [pathname])
  const [readingProgress, setReadingProgress] = useState(0)
  const isResourcesActive = pathname === '/resources' || pathname.startsWith('/posts')

  useEffect(() => {
    setHeaderTheme(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    if (headerTheme && headerTheme !== theme) setTheme(headerTheme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerTheme])

  useEffect(() => {
    if (!isResourceArticlePage) {
      setReadingProgress(0)
      return
    }

    let raf = 0

    const updateProgress = () => {
      const doc = document.documentElement
      const scrollTop = window.scrollY ?? doc.scrollTop
      const scrollableHeight = doc.scrollHeight - window.innerHeight
      const ratio = scrollableHeight <= 0 ? 0 : scrollTop / scrollableHeight
      const pct = Math.min(100, Math.max(0, ratio * 100))
      setReadingProgress(pct)
    }

    const onScrollOrResize = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(updateProgress)
    }

    updateProgress()
    window.addEventListener('scroll', onScrollOrResize, { passive: true })
    window.addEventListener('resize', onScrollOrResize, { passive: true })

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScrollOrResize)
      window.removeEventListener('resize', onScrollOrResize)
    }
  }, [isResourceArticlePage, pathname])

  return (
    <header
      className={cn('site-header', isResourceArticlePage && 'site-header--with-reading-progress')}
    >
      <div className="container site-header__container">
        <div className="site-header__inner">
          <div className="site-header__left">
            <Link href="/">
              <Logo loading="eager" priority="high" />
            </Link>

            <span className="site-header__tagline">
              Evidence based medical resources
            </span>

            <Button
              asChild
              size="small"
              variant="ghost"
              className={isResourcesActive ? 'is-active' : undefined}
            >
              <Link aria-current={isResourcesActive ? 'page' : undefined} href="/resources">
                Resources
              </Link>
            </Button>
          </div>

          {/* <Button asChild size="small" variant="ghost">
            <Link href="/account">Account</Link>
          </Button> */}
        </div>
      </div>

      {isResourceArticlePage ? (
        <div
          aria-label="Article reading progress"
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={Math.round(readingProgress)}
          className="site-header__reading-progress"
          role="progressbar"
        >
          <div
            className="site-header__reading-progress-fill"
            style={{ transform: `scaleX(${readingProgress / 100})` }}
          />
        </div>
      ) : null}
    </header>
  )
}

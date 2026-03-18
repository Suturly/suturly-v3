'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import type { Header } from '@/payload-types'

import { Button } from '@/components/ui/button'
import { Logo } from '@/components/Logo/Logo'

interface HeaderClientProps {
  data: Header
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ data }) => {
  /* Storing the value in a useState to avoid hydration errors */
  const [theme, setTheme] = useState<string | null>(null)
  const { headerTheme, setHeaderTheme } = useHeaderTheme()
  const pathname = usePathname()
  const isResourcesActive = pathname === '/resources' || pathname.startsWith('/posts')

  useEffect(() => {
    setHeaderTheme(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    if (headerTheme && headerTheme !== theme) setTheme(headerTheme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerTheme])

  return (
    <header className="site-header">
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
    </header>
  )
}

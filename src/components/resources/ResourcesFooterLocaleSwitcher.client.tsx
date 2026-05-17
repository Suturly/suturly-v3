'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

import type { AppLocale } from '@/utilities/localeShared'

/** `/resources`, `/resources/:slug`, `/es/resources`, `/es/resources/:slug` only. */
function parseResourcesPath(pathname: string): { locale: AppLocale; slug?: string } | null {
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length === 0) return null

  if (parts[0] === 'es') {
    if (parts[1] !== 'resources') return null
    if (parts.length === 2) return { locale: 'es' }
    if (parts.length === 3) return { locale: 'es', slug: decodeURIComponent(parts[2]) }
    return null
  }

  if (parts[0] !== 'resources') return null
  if (parts.length === 1) return { locale: 'en' }
  if (parts.length === 2) return { locale: 'en', slug: decodeURIComponent(parts[1]) }
  return null
}

function listingHref(locale: AppLocale): string {
  return locale === 'es' ? '/es/resources' : '/resources'
}

function detailHref(locale: AppLocale, slug: string): string {
  const enc = encodeURIComponent(slug)
  return locale === 'es' ? `/es/resources/${enc}` : `/resources/${enc}`
}

/**
 * EN ⇄ ES links for resources listing + detail. Uses the slug from the current URL;
 * middleware + `/api/resources/resolve-locale-slug` issue 308s to the canonical localized slug when needed.
 */
export function ResourcesFooterLocaleSwitcher() {
  const pathname = usePathname()
  const parsed = pathname ? parseResourcesPath(pathname) : null

  if (!parsed) return null

  const { locale, slug } = parsed
  const enHref = slug ? detailHref('en', slug) : listingHref('en')
  const esHref = slug ? detailHref('es', slug) : listingHref('es')

  const linkClass =
    'text-foreground underline-offset-4 hover:text-primary hover:underline decoration-transparent hover:decoration-current'
  const currentClass = 'font-semibold text-primary cursor-default pointer-events-none'

  return (
    <nav
      aria-label="Resources language"
      className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground"
    >
      <span className="mr-1 shrink-0">Language:</span>
      {locale === 'en' ? (
        <span className={currentClass}>English</span>
      ) : (
        <Link className={linkClass} href={enHref}>
          English
        </Link>
      )}
      <span aria-hidden className="select-none">
        |
      </span>
      {locale === 'es' ? (
        <span className={currentClass}>Español</span>
      ) : (
        <Link className={linkClass} href={esHref}>
          Español
        </Link>
      )}
    </nav>
  )
}

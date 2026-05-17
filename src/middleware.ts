import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  isResourcesGateEnabled,
  verifyResourcesGateToken,
} from '@/lib/resourcesGateToken'
import { LOCALE_HEADER } from '@/utilities/localeShared'

function isProtectedResourcesPath(pathname: string): boolean {
  return pathname === '/resources' || pathname.startsWith('/resources/')
}

/** `/es/resources/:slug` → canonical Spanish path when slug was the English one. */
async function redirectEsPrefixedResourceSlug(
  request: NextRequest,
  pathname: string,
): Promise<NextResponse | null> {
  const trimmed = pathname.replace(/\/$/, '') || '/'
  const match = /^\/es\/resources\/([^/]+)$/.exec(trimmed)
  if (!match) return null

  const slug = decodeURIComponent(match[1] ?? '')
  if (!slug) return null

  try {
    const origin = request.nextUrl.origin
    const res = await fetch(
      `${origin}/api/resources/resolve-locale-slug?intent=es&slug=${encodeURIComponent(slug)}`,
      {
        cache: 'no-store',
        headers: {
          cookie: request.headers.get('cookie') ?? '',
        },
      },
    )
    if (!res.ok) return null

    const data = (await res.json()) as { redirect?: string | null }
    const to = data.redirect
    if (!to || typeof to !== 'string') return null

    const dest = new URL(to, origin)
    dest.search = request.nextUrl.search
    return NextResponse.redirect(dest, 308)
  } catch {
    return null
  }
}

/** `/resources/:slug` → canonical English path when slug was the Spanish one. */
async function redirectUnprefixedResourceSlug(
  request: NextRequest,
  pathname: string,
): Promise<NextResponse | null> {
  const trimmed = pathname.replace(/\/$/, '') || '/'
  const match = /^\/resources\/([^/]+)$/.exec(trimmed)
  if (!match) return null

  const slug = decodeURIComponent(match[1] ?? '')
  if (!slug) return null

  try {
    const origin = request.nextUrl.origin
    const res = await fetch(
      `${origin}/api/resources/resolve-locale-slug?intent=en&slug=${encodeURIComponent(slug)}`,
      {
        cache: 'no-store',
        headers: {
          cookie: request.headers.get('cookie') ?? '',
        },
      },
    )
    if (!res.ok) return null

    const data = (await res.json()) as { redirect?: string | null }
    const to = data.redirect
    if (!to || typeof to !== 'string') return null

    const dest = new URL(to, origin)
    dest.search = request.nextUrl.search
    return NextResponse.redirect(dest, 308)
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // --- Canonical localized slugs (before rewrite + gate) ---
  const esSlugRedirect = await redirectEsPrefixedResourceSlug(request, pathname)
  if (esSlugRedirect) return esSlugRedirect

  const enSlugRedirect = await redirectUnprefixedResourceSlug(request, pathname)
  if (enSlugRedirect) return enSlugRedirect

  // --- Canonical EN: strip legacy /en prefix (301 → unprefixed URL) ---
  if (pathname === '/en') {
    return NextResponse.redirect(new URL(`/${search}`, request.url), 301)
  }
  if (pathname.startsWith('/en/')) {
    const destPath = pathname.slice('/en'.length) || '/'
    return NextResponse.redirect(new URL(`${destPath}${search}`, request.url), 301)
  }

  // --- Spanish: rewrite to same App Router pathname, tag request with locale ---
  let pathnameForApp = pathname
  const isEsPrefixed = pathname === '/es' || pathname.startsWith('/es/')
  if (pathname === '/es') {
    pathnameForApp = '/'
  } else if (pathname.startsWith('/es/')) {
    pathnameForApp = pathname.slice('/es'.length) || '/'
  }

  const response =
    isEsPrefixed ?
      (() => {
        const rewriteUrl = request.nextUrl.clone()
        rewriteUrl.pathname = pathnameForApp
        const res = NextResponse.rewrite(rewriteUrl)
        res.headers.set(LOCALE_HEADER, 'es')
        return res
      })()
    : NextResponse.next()

  // --- Resources password gate (unchanged behavior on effective path after /es rewrite) ---
  if (!isResourcesGateEnabled()) {
    return response
  }

  if (!isProtectedResourcesPath(pathnameForApp)) {
    return response
  }

  const token = request.cookies.get('resources_gate')?.value
  if (token && (await verifyResourcesGateToken(token))) {
    return response
  }

  // Preserve browser URL (/es/resources/…) in next= so redirect-back works correctly.
  const next = `${pathname}${search}`
  const gateUrl = new URL('/resources-gate', request.url)
  gateUrl.searchParams.set('next', next)
  return NextResponse.redirect(gateUrl)
}

export const config = {
  matcher: [
    '/en',
    '/en/:path*',
    '/es',
    '/es/:path*',
    '/resources',
    '/resources/:path*',
    '/posts',
    '/posts/:path*',
  ],
}

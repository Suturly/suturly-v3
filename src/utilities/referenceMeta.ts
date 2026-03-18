import { getServerSideURL } from './getURL'

const TITLE_CACHE_TTL_MS = 24 * 60 * 60 * 1000
const FETCH_TIMEOUT_MS = 3000

type CacheEntry = {
  expiresAt: number
  title: string | null
}

const titleCache = new Map<string, CacheEntry>()

const toAbsoluteUrl = (href: string): string | null => {
  const trimmed = href.trim()
  if (!trimmed) return null

  try {
    return new URL(trimmed).toString()
  } catch {
    if (!trimmed.startsWith('/')) return null
    return new URL(trimmed, getServerSideURL()).toString()
  }
}

const extractMetaTitle = (html: string): string | null => {
  const ogMatch = html.match(
    /<meta[^>]+property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i,
  )
  if (ogMatch?.[1]) return ogMatch[1].trim()

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  if (titleMatch?.[1]) return titleMatch[1].replace(/\s+/g, ' ').trim()

  return null
}

const fetchTitle = async (href: string): Promise<string | null> => {
  const absoluteUrl = toAbsoluteUrl(href)
  if (!absoluteUrl) return null

  const now = Date.now()
  const cached = titleCache.get(absoluteUrl)
  if (cached && cached.expiresAt > now) return cached.title

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(absoluteUrl, {
      headers: {
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: controller.signal,
    })

    if (!response.ok) {
      titleCache.set(absoluteUrl, { expiresAt: now + TITLE_CACHE_TTL_MS, title: null })
      return null
    }

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('text/html')) {
      titleCache.set(absoluteUrl, { expiresAt: now + TITLE_CACHE_TTL_MS, title: null })
      return null
    }

    const html = await response.text()
    const title = extractMetaTitle(html)

    titleCache.set(absoluteUrl, { expiresAt: now + TITLE_CACHE_TTL_MS, title })
    return title
  } catch {
    titleCache.set(absoluteUrl, { expiresAt: now + TITLE_CACHE_TTL_MS, title: null })
    return null
  } finally {
    clearTimeout(timeout)
  }
}

export const resolveReferenceTitles = async (hrefs: string[]) => {
  const entries = await Promise.all(
    Array.from(new Set(hrefs)).map(async (href) => [href, await fetchTitle(href)] as const),
  )

  return entries.reduce<Record<string, string>>((acc, [href, title]) => {
    if (title) acc[href] = title
    return acc
  }, {})
}

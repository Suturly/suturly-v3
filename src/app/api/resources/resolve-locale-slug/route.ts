import configPromise from '@payload-config'
import { NextResponse, type NextRequest } from 'next/server'
import { getPayload } from 'payload'

type ResolveLocaleSlugIntent = 'en' | 'es'

/**
 * GET /api/resources/resolve-locale-slug?slug=...&intent=en|es
 *
 * Canonical resource URL slugs differ per locale (localized `slug` field).
 *
 * - **intent=es** (for `/es/resources/:slug`): resolve to the Spanish slug path.
 * - **intent=en** (for `/resources/:slug`): resolve to the English slug path.
 *
 * If `slug` is already the canonical one for that intent, returns `{ redirect: null }`.
 * Published posts only; same visibility as public pages.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const slugRaw = req.nextUrl.searchParams.get('slug')?.trim() ?? ''
  const intentParam = req.nextUrl.searchParams.get('intent')?.toLowerCase()
  const intent: ResolveLocaleSlugIntent =
    intentParam === 'en' ? 'en' : intentParam === 'es' ? 'es' : 'es'

  if (!slugRaw || slugRaw.length > 512) {
    return NextResponse.json({ redirect: null as string | null })
  }

  const slug = decodeURIComponent(slugRaw)

  try {
    const payload = await getPayload({ config: configPromise })

    if (intent === 'es') {
      const esMatch = await payload.find({
        collection: 'posts',
        depth: 0,
        draft: false,
        limit: 1,
        locale: 'es',
        overrideAccess: false,
        pagination: false,
        where: { slug: { equals: slug } },
      })
      if (esMatch.docs[0]) {
        return NextResponse.json({ redirect: null as string | null })
      }

      const enMatch = await payload.find({
        collection: 'posts',
        depth: 0,
        draft: false,
        limit: 1,
        locale: 'en',
        overrideAccess: false,
        pagination: false,
        where: { slug: { equals: slug } },
      })
      const enDoc = enMatch.docs[0]
      if (!enDoc?.id) {
        return NextResponse.json({ redirect: null as string | null })
      }

      const esDoc = await payload.findByID({
        collection: 'posts',
        id: enDoc.id,
        depth: 0,
        draft: false,
        locale: 'es',
        overrideAccess: false,
      })
      const esSlug = typeof esDoc?.slug === 'string' ? esDoc.slug.trim() : ''
      if (!esSlug || esSlug === slug) {
        return NextResponse.json({ redirect: null as string | null })
      }
      return NextResponse.json({
        redirect: `/es/resources/${encodeURIComponent(esSlug)}`,
      })
    }

    // intent === 'en' — unprefixed English URLs
    const enMatch = await payload.find({
      collection: 'posts',
      depth: 0,
      draft: false,
      limit: 1,
      locale: 'en',
      overrideAccess: false,
      pagination: false,
      where: { slug: { equals: slug } },
    })
    if (enMatch.docs[0]) {
      return NextResponse.json({ redirect: null as string | null })
    }

    const esMatch = await payload.find({
      collection: 'posts',
      depth: 0,
      draft: false,
      limit: 1,
      locale: 'es',
      overrideAccess: false,
      pagination: false,
      where: { slug: { equals: slug } },
    })
    const esDoc = esMatch.docs[0]
    if (!esDoc?.id) {
      return NextResponse.json({ redirect: null as string | null })
    }

    const enDoc = await payload.findByID({
      collection: 'posts',
      id: esDoc.id,
      depth: 0,
      draft: false,
      locale: 'en',
      overrideAccess: false,
    })
    const enSlug = typeof enDoc?.slug === 'string' ? enDoc.slug.trim() : ''
    if (!enSlug || enSlug === slug) {
      return NextResponse.json({ redirect: null as string | null })
    }
    return NextResponse.json({
      redirect: `/resources/${encodeURIComponent(enSlug)}`,
    })
  } catch {
    return NextResponse.json({ redirect: null as string | null })
  }
}

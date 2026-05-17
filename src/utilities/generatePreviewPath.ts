import { PayloadRequest, CollectionSlug } from 'payload'

const collectionPrefixMap: Partial<Record<CollectionSlug, string>> = {
  posts: '/resources',
  pages: '',
}

type Props = {
  collection: keyof typeof collectionPrefixMap
  slug: string
  req: PayloadRequest
}

export const generatePreviewPath = ({ collection, slug }: Props) => {
  // Allow empty strings, e.g. for the homepage
  if (slug === undefined || slug === null) {
    return null
  }

  // Encode to support slugs with special characters
  const encodedSlug = encodeURIComponent(slug)

  const previewSecret = process.env.PREVIEW_SECRET?.trim() ?? ''
  if (!previewSecret && process.env.NODE_ENV === 'production') {
    console.warn(
      '[generatePreviewPath] PREVIEW_SECRET is missing — admin Preview links will fail until it is set (e.g. on Vercel).',
    )
  }

  const encodedParams = new URLSearchParams({
    slug: encodedSlug,
    collection,
    path: `${collectionPrefixMap[collection]}/${encodedSlug}`,
    previewSecret,
  })

  const url = `/next/preview?${encodedParams.toString()}`

  return url
}

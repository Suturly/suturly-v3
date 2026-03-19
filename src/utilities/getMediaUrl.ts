/**
 * Processes media resource URL to ensure proper formatting
 * @param url The original URL from the resource
 * @param cacheTag Optional cache tag to append to the URL
 * @returns Properly formatted URL with cache tag if provided
 */
export const getMediaUrl = (url: string | null | undefined, cacheTag?: string | null): string => {
  if (!url) return ''

  const encodedCacheTag = cacheTag && cacheTag !== '' ? encodeURIComponent(cacheTag) : null
  const isPayloadMediaFileRoute =
    url.startsWith('/api/media/file/') ||
    url.startsWith('http://') ||
    url.startsWith('https://')
      ? new URL(url, 'https://placeholder.local').pathname.startsWith('/api/media/file/')
      : false

  // Check if URL already has http/https protocol
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // Do not append cache query for Payload's file endpoint.
    // Some environments treat arbitrary query strings as a different resource and return 404.
    if (isPayloadMediaFileRoute) return url

    const separator = url.includes('?') ? '&' : '?'
    return encodedCacheTag ? `${url}${separator}v=${encodedCacheTag}` : url
  }

  // Keep local media URLs relative so they work across localhost, preview, and production domains.
  // As above, skip cache query for Payload file endpoint URLs.
  if (isPayloadMediaFileRoute) return url

  const separator = url.includes('?') ? '&' : '?'
  return encodedCacheTag ? `${url}${separator}v=${encodedCacheTag}` : url
}

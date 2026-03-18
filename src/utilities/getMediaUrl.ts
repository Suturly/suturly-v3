/**
 * Processes media resource URL to ensure proper formatting
 * @param url The original URL from the resource
 * @param cacheTag Optional cache tag to append to the URL
 * @returns Properly formatted URL with cache tag if provided
 */
export const getMediaUrl = (url: string | null | undefined, cacheTag?: string | null): string => {
  if (!url) return ''

  if (cacheTag && cacheTag !== '') {
    cacheTag = encodeURIComponent(cacheTag)
  }

  // Check if URL already has http/https protocol
  if (url.startsWith('http://') || url.startsWith('https://')) {
    const separator = url.includes('?') ? '&' : '?'
    return cacheTag ? `${url}${separator}${cacheTag}` : url
  }

  // Keep local media URLs relative so they work across localhost, preview, and production domains.
  const separator = url.includes('?') ? '&' : '?'
  return cacheTag ? `${url}${separator}${cacheTag}` : url
}

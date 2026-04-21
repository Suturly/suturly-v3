import { getServerSideURL } from './getURL'

/** Apex ↔ www so admin works when `NEXT_PUBLIC_SERVER_URL` lists only one of them. */
function withWwwVariants(origin: string): string[] {
  try {
    const u = new URL(origin)
    const host = u.hostname
    const out = new Set<string>([u.origin])
    if (host === 'localhost' || host.endsWith('.vercel.app') || host.endsWith('.local')) {
      return [...out]
    }
    if (host.startsWith('www.')) {
      u.hostname = host.slice(4)
      out.add(u.origin)
    } else {
      u.hostname = `www.${host}`
      out.add(u.origin)
    }
    return [...out]
  } catch {
    return [origin]
  }
}

/**
 * Origins for Payload `cors` and `csrf`. Cookie-based admin sessions only work when
 * the browser's `Origin` is listed in `csrf`. Extra hosts: comma-separated
 * `PAYLOAD_TRUSTED_ORIGINS` or `PAYLOAD_CORS_ORIGINS`.
 */
export function getPayloadTrustedOrigins(): string[] {
  const fromEnv = (process.env.PAYLOAD_TRUSTED_ORIGINS || process.env.PAYLOAD_CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean)

  const candidates = [
    ...fromEnv,
    getServerSideURL(),
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    process.env.VERCEL_BRANCH_URL ? `https://${process.env.VERCEL_BRANCH_URL}` : undefined,
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined,
  ].filter((x): x is string => Boolean(x))

  const origins = candidates
    .flatMap((raw) => {
      try {
        const origin = new URL(raw).origin
        return withWwwVariants(origin)
      } catch {
        return []
      }
    })
    .filter(Boolean)

  return [...new Set(origins)]
}

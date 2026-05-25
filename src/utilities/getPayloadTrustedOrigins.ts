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
 *
 * On Vercel with a custom production domain, also whitelists `https://{repo}.vercel.app`
 * so admin save works on both www.suturly.com and suturly-v3.vercel.app.
 */
export function getPayloadTrustedOrigins(): string[] {
  const fromEnv = (process.env.PAYLOAD_TRUSTED_ORIGINS || process.env.PAYLOAD_CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean)

  // When a custom domain is production, VERCEL_PROJECT_PRODUCTION_URL is often www.suturly.com —
  // not suturly-v3.vercel.app. Editors on the *.vercel.app URL still send that Origin on save.
  const vercelProjectAppUrl =
    process.env.VERCEL && process.env.VERCEL_GIT_REPO_SLUG
      ? `https://${process.env.VERCEL_GIT_REPO_SLUG}.vercel.app`
      : undefined

  const candidates = [
    ...fromEnv,
    getServerSideURL(),
    vercelProjectAppUrl,
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

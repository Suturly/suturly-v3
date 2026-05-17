import { withPayload } from '@payloadcms/next/withPayload'
import path from 'path'
import { fileURLToPath } from 'url'

import redirects from './redirects.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const getRemotePatterns = () => {
  const possibleOrigins = [
    process.env.NEXT_PUBLIC_SERVER_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined,
    process.env.__NEXT_PRIVATE_ORIGIN,
    'http://localhost:3000',
  ].filter(Boolean)

  const uniqueOrigins = [...new Set(possibleOrigins)]

  return uniqueOrigins
    .map((origin) => {
      try {
        const parsed = new URL(origin)
        return {
          hostname: parsed.hostname,
          protocol: parsed.protocol.replace(':', ''),
          port: parsed.port || undefined,
        }
      } catch {
        return null
      }
    })
    .filter(Boolean)
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Avoid picking a parent lockfile (e.g. ~/package-lock.json or Documents/GitHub/package-lock.json)
  // when other package-lock.json files exist above this app in the directory tree.
  outputFileTracingRoot: path.join(__dirname),
  images: {
    remotePatterns: getRemotePatterns(),
  },
  webpack: (webpackConfig) => {
    // Only map .cjs / .mjs — do NOT alias `.js` → `.ts` here. Next's dev client
    // emits `main-app.js`, `app-pages-internals.js`, etc.; preferring `.ts` for
    // every `.js` request breaks those runtime chunks (browser sees 404s on
    // `/_next/static/chunks/main-app.js` while `webpack.js` still loads).
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  reactStrictMode: true,
  redirects,
}

export default withPayload(nextConfig, { devBundleServerPackages: false })

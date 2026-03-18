import { withPayload } from '@payloadcms/next/withPayload'

import redirects from './redirects.js'

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
  images: {
    remotePatterns: getRemotePatterns(),
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  reactStrictMode: true,
  redirects,
}

export default withPayload(nextConfig, { devBundleServerPackages: false })

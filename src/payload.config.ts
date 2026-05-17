import { postgresAdapter } from '@payloadcms/db-postgres'
import sharp from 'sharp'
import path from 'path'
import { buildConfig, PayloadRequest } from 'payload'
import { fileURLToPath } from 'url'

import { Categories } from './collections/Categories'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Resources } from './collections/Resources/index'
import { Users } from './collections/Users'
import { Footer } from './Footer/config'
import { Header } from './Header/config'
import { Marketing } from './Marketing/config'
import { plugins, storageRuntimeInfo } from './plugins'
import { defaultLexical } from '@/fields/defaultLexical'
import { getServerSideURL } from './utilities/getURL'
import { getPayloadTrustedOrigins } from './utilities/getPayloadTrustedOrigins'
import { RESOURCE_CATEGORY_SEED } from './constants/resourceCategories'
import { migrations } from './migrations'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const trustedOrigins = getPayloadTrustedOrigins()

export default buildConfig({
  serverURL: getServerSideURL(),
  cors: trustedOrigins,
  csrf: trustedOrigins,
  localization: {
    defaultLocale: 'en',
    locales: [
      { code: 'en', label: 'English' },
      /** Empty ES text fields fall back to EN on read (admin list columns + API). Lexical/array gaps still use hooks / frontend merge. */
      { code: 'es', label: 'Spanish', fallbackLocale: 'en' },
    ],
    fallback: true,
  },
  admin: {
    components: {
      // The `BeforeLogin` component renders a message that you see while logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below.
      beforeLogin: ['@/components/BeforeLogin'],
      // The `BeforeDashboard` component renders the 'welcome' block that you see after logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below.
      beforeDashboard: ['@/components/BeforeDashboard'],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Users.slug,
    livePreview: {
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
        {
          label: 'Tablet',
          name: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'Desktop',
          name: 'desktop',
          width: 1440,
          height: 900,
        },
      ],
    },
  },
  // This config helps us configure global or default features that the other editors can inherit
  editor: defaultLexical,
  db: postgresAdapter({
    // Schema changes go through `npm run payload migrate:create` -> hand-edit (when data
    // preservation is needed) -> `npm run payload migrate`. Migrations live in src/migrations/.
    // We graduated from push: true after the 3.84.x bump introduced destructive plugin
    // schema changes that needed data-preservation SQL.
    push: false,
    /** Registered migrations run on prod DB connect (`NODE_ENV === 'production'`); CLI still reads `src/migrations/*.ts`. */
    prodMigrations: migrations,
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  collections: [Pages, Resources, Media, Categories, Users],
  globals: [Header, Footer, Marketing],
  plugins,
  onInit: async (payload) => {
    payload.logger.info(
      `[storage] Active mode: ${storageRuntimeInfo.useR2Storage ? 'r2' : 'local'} (R2_ENABLED=${storageRuntimeInfo.isR2StorageEnabled}, R2_ENV_READY=${storageRuntimeInfo.hasR2StorageEnv})`,
    )

    for (const warning of storageRuntimeInfo.warnings) {
      payload.logger.warn(`[storage] ${warning}`)
    }

    const existingCategories = await payload.find({
      collection: 'categories',
      depth: 0,
      limit: 100,
      pagination: false,
      where: {
        slug: {
          in: RESOURCE_CATEGORY_SEED.map((category) => category.slug),
        },
      },
      overrideAccess: true,
    })

    const existingBySlug = new Map(
      existingCategories.docs
        .map((category) => {
          const slug = typeof category?.slug === 'string' ? category.slug : null
          return slug ? [slug, category] : null
        })
        .filter(Boolean) as Array<[string, (typeof existingCategories.docs)[number]]>,
    )

    for (const category of RESOURCE_CATEGORY_SEED) {
      const existingCategory = existingBySlug.get(category.slug)

      if (existingCategory) {
        if (existingCategory.title !== category.title) {
          await payload.update({
            collection: 'categories',
            id: existingCategory.id,
            data: {
              title: category.title,
            },
            overrideAccess: true,
          })
        }
        continue
      }

      await payload.create({
        collection: 'categories',
        data: {
          title: category.title,
          slug: category.slug,
        },
        overrideAccess: true,
      })
    }
  },
  secret: process.env.PAYLOAD_SECRET,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        // Allow logged in users to execute this endpoint (default)
        if (req.user) return true

        const secret = process.env.CRON_SECRET
        if (!secret) return false

        // If there is no logged in user, then check
        // for the Vercel Cron secret to be present as an
        // Authorization header:
        const authHeader = req.headers.get('authorization')
        return authHeader === `Bearer ${secret}`
      },
    },
    tasks: [],
  },
})

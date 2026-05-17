import { s3Storage } from '@payloadcms/storage-s3'
import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { searchPlugin } from '@payloadcms/plugin-search'
import { payloadContentTranslatorPlugin } from '@jhb.software/payload-content-translator-plugin'
import type { Field, PayloadRequest, Plugin } from 'payload'
import { adminOnlyAccess } from '@/access/roles'
import { revalidateRedirects } from '@/hooks/revalidateRedirects'
import { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
import { FixedToolbarFeature, HeadingFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { searchFields } from '@/search/fieldOverrides'
import { beforeSyncWithSearch } from '@/search/beforeSync'

import { Page, Post } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'
import { translatorTranslateEndpointReplacementPlugin } from '@/plugins/translatorTranslateEndpointReplacement'
import { deeplResolver } from '@/translators/deeplResolver'

const normalizeEnvFlag = (value?: string): string =>
  (value || '')
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .toLowerCase()

const isEnvFlagEnabled = (value?: string): boolean => normalizeEnvFlag(value) === 'true'

const hasR2StorageEnv =
  Boolean(process.env.R2_BUCKET) &&
  Boolean(process.env.R2_ACCESS_KEY_ID) &&
  Boolean(process.env.R2_SECRET_ACCESS_KEY) &&
  Boolean(process.env.R2_ACCOUNT_ID)

const isR2StorageEnabled = isEnvFlagEnabled(process.env.R2_ENABLED)
const useR2Storage = isR2StorageEnabled && hasR2StorageEnv

const r2StorageWarnings: string[] = []
if (isR2StorageEnabled && !hasR2StorageEnv) {
  r2StorageWarnings.push(
    'R2_ENABLED is true, but one or more required env vars are missing (R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ACCOUNT_ID). Falling back to local file storage.',
  )
}
if (!isR2StorageEnabled && hasR2StorageEnv) {
  r2StorageWarnings.push(
    'R2 credentials are present, but R2_ENABLED is not true. Local file storage is active.',
  )
}

export const storageRuntimeInfo = {
  isR2StorageEnabled,
  hasR2StorageEnv,
  useR2Storage,
  warnings: r2StorageWarnings,
}

const deeplApiKey = process.env.DEEPL_API_KEY?.trim()
const isTranslatorEnabled = Boolean(deeplApiKey)

const translatorEndpointAccess = ({ req }: { req: PayloadRequest }) => Boolean(req.user)

export const translatorRuntimeInfo = {
  enabled: isTranslatorEnabled,
  reason: isTranslatorEnabled
    ? 'DEEPL_API_KEY present; resolver registered.'
    : 'DEEPL_API_KEY missing; translator disabled. Translate-all button will show a config hint.',
}

/**
 * Recursively walks a field tree and forces `localized: false` on every named field.
 * Used to opt out of plugin-baked-in localization for collections that are NOT in the
 * EN/ES localization scope (Forms, in our case). Without this, enabling project-wide
 * localization in payload.config.ts would force a destructive schema change for the
 * @payloadcms/plugin-form-builder fields, which now ship with `localized: true` in 3.84.x.
 */
const stripLocalization = (fields: Field[]): Field[] =>
  fields.map((field) => {
    const next = { ...field } as Field

    if ('localized' in next) {
      ;(next as { localized?: boolean }).localized = false
    }

    if (next.type === 'array' || next.type === 'group' || next.type === 'collapsible') {
      ;(next as { fields: Field[] }).fields = stripLocalization((next as { fields: Field[] }).fields)
    }
    if (next.type === 'row') {
      next.fields = stripLocalization(next.fields)
    }
    if (next.type === 'tabs') {
      next.tabs = next.tabs.map((tab) => ({ ...tab, fields: stripLocalization(tab.fields) }))
    }
    if (next.type === 'blocks') {
      next.blocks = next.blocks.map((block) => ({
        ...block,
        fields: stripLocalization(block.fields),
      }))
    }

    return next
  })

const generateTitle: GenerateTitle<Post | Page> = ({ doc }) => {
  return doc?.title ? `${doc.title} | Payload Website Template` : 'Payload Website Template'
}

const generateURL: GenerateURL<Post | Page> = ({ doc }) => {
  const url = getServerSideURL()

  return doc?.slug ? `${url}/${doc.slug}` : url
}

export const plugins: Plugin[] = [
  ...(useR2Storage
    ? [
        s3Storage({
          collections: {
            media: true,
          },
          bucket: process.env.R2_BUCKET!,
          config: {
            credentials: {
              accessKeyId: process.env.R2_ACCESS_KEY_ID!,
              secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
            },
            region: 'auto',
            endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
          },
        }),
      ]
    : []),
  redirectsPlugin({
    collections: ['pages', 'posts'],
    overrides: {
      access: {
        create: adminOnlyAccess,
        delete: adminOnlyAccess,
        read: adminOnlyAccess,
        update: adminOnlyAccess,
      },
      admin: {
        group: 'Plugins',
      },
      // @ts-expect-error - This is a valid override, mapped fields don't resolve to the same type
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'from') {
            return {
              ...field,
              admin: {
                description: 'You will need to rebuild the website when changing this field.',
              },
            }
          }
          return field
        })
      },
      hooks: {
        afterChange: [revalidateRedirects],
      },
    },
  }),
  nestedDocsPlugin({
    collections: ['categories'],
    generateURL: (docs) => docs.reduce((url, doc) => `${url}/${doc.slug}`, ''),
  }),
  seoPlugin({
    generateTitle,
    generateURL,
  }),
  formBuilderPlugin({
    fields: {
      payment: false,
    },
    formOverrides: {
      access: {
        create: adminOnlyAccess,
        delete: adminOnlyAccess,
        read: adminOnlyAccess,
        update: adminOnlyAccess,
      },
      admin: {
        group: 'Plugins',
      },
      fields: ({ defaultFields }) => {
        // Forms are NOT part of EN/ES scope. Strip localized: true that the
        // plugin defaults to in 3.84.x; without this the project-wide localization
        // config would silently force a destructive schema change on forms tables.
        const unlocalized = stripLocalization(defaultFields)

        return unlocalized.map((field) => {
          if ('name' in field && field.name === 'confirmationMessage') {
            return {
              ...field,
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    FixedToolbarFeature(),
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                  ]
                },
              }),
            }
          }
          return field
        })
      },
    },
    formSubmissionOverrides: {
      access: {
        // Public sites POST here without a session (same as typical form-builder usage).
        create: () => true,
        delete: adminOnlyAccess,
        read: adminOnlyAccess,
        update: adminOnlyAccess,
      },
      admin: {
        group: 'Plugins',
      },
    },
  }),
  searchPlugin({
    collections: ['posts'],
    beforeSync: beforeSyncWithSearch,
    // EN-only search index for now. The search plugin auto-localizes when
    // config.localization is set; we explicitly opt out so the search.title
    // column stays a single shared value and gets indexed in EN.
    // Revisit when ES search becomes a requirement.
    localize: false,
    searchOverrides: {
      access: {
        create: adminOnlyAccess,
        delete: adminOnlyAccess,
        read: adminOnlyAccess,
        update: adminOnlyAccess,
      },
      admin: {
        group: 'Plugins',
      },
      fields: ({ defaultFields }) => {
        return [...defaultFields, ...searchFields]
      },
    },
  }),
  // Translator plugin: registers resolver on `config.custom.translator.resolver`. Its bundled POST
  // `/translator/translate` still imports the package's traverseFields — we append
  // `translatorTranslateEndpointReplacementPlugin` so that route runs our translateOperation instead.
  ...(isTranslatorEnabled
    ? [
        payloadContentTranslatorPlugin({
          collections: [],
          globals: [],
          resolver: deeplResolver({ apiKey: deeplApiKey as string }),
          access: translatorEndpointAccess,
        }),
        translatorTranslateEndpointReplacementPlugin(translatorEndpointAccess),
      ]
    : []),
]

import type { CollectionConfig } from 'payload'
import { randomUUID } from 'node:crypto'

import {
  BoldFeature,
  BlocksFeature,
  EXPERIMENTAL_TableFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  ItalicFeature,
  InlineToolbarFeature,
  LinkFeature,
  OrderedListFeature,
  ParagraphFeature,
  UnorderedListFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { authenticated } from '../../access/authenticated'
import { authenticatedCreateResourceEnglishLocaleOnly } from '../../access/authenticatedCreateResourceEnglishLocale'
import { authenticatedOrPublished } from '../../access/authenticatedOrPublished'
import { adminOnlyDeleteAccess, isAdminRole } from '../../access/roles'
import { Banner } from '../../blocks/Banner/config'
import { ChapterCitationBlock } from '../../blocks/ChapterCitation/config'
import { DoDontCardBlock } from '../../blocks/DoDontCard/config'
import { DropdownBlock } from '../../blocks/Dropdown/config'
import { FloatImageBlock } from '../../blocks/FloatImage/config'
import { MediaBlock } from '../../blocks/MediaBlock/config'
import { ProcedureTypeCardBlock } from '../../blocks/ProcedureTypeCard/config'
import { TimelineBlock } from '../../blocks/Timeline/config'
import { ToDoListBlock } from '../../blocks/ToDoList/config'
import { TwoColumnImagesBlock } from '../../blocks/TwoColumnImages/config'
import { generatePreviewPath } from '../../utilities/generatePreviewPath'
import { populateAuthors } from './hooks/populateAuthors'
import { revalidateDelete, revalidatePost } from './hooks/revalidatePost'
import { migrateLegacyCitationsAfterRead } from './hooks/migrateLegacyCitationsAfterRead'
import { mergeEnglishIntoSpanishAdminRead } from './hooks/mergeEnglishIntoSpanishAdminRead'
import { mergeEnglishListColumnsAfterFind } from './hooks/mergeEnglishListColumnsAfterFind'
import { validateResourceCitations } from './hooks/validateCitations'
import { deduplicateArrayRowIds } from './hooks/deduplicateArrayRowIds'
import { stampSpanishMirroringStop } from './hooks/stampSpanishMirroringStop'
import { syncEnglishToSpanish } from './hooks/syncEnglishToSpanish'
import { trackEnUpdatedAt } from './hooks/trackEnUpdatedAt'
import { markLocalized } from '../../utilities/markLocalized'
import { translateResourceEndpoint } from '../../translators/translateResourceEndpoint'

import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'
import { slugField } from 'payload'

import type { User } from '@/payload-types'

const FIXED_CATEGORY_SLUGS = ['educatin', 'pre-op', 'operation-day', 'post-op', 'next-steps']

const RESOURCE_SPECIALTY_OPTIONS = [
  { label: 'Plastic & Reconstructive Surgery', value: 'plastic_reconstructive' },
  { label: 'Orthopedic Surgery', value: 'orthopedic' },
  { label: 'Gastroenterology (GI)', value: 'gastroenterology' },
  { label: 'Bariatric Surgery', value: 'bariatric' },
  { label: 'Dermatology', value: 'dermatology' },
  { label: 'Otolaryngology (ENT)', value: 'otolaryngology' },
] as const

const normalizeRelationshipValue = (value: unknown): null | number | string => {
  if (value === null || value === undefined) return null
  if (typeof value === 'number' || typeof value === 'string') return value
  if (typeof value === 'object' && value !== null && 'id' in value) {
    const id = (value as { id?: unknown }).id
    if (typeof id === 'number' || typeof id === 'string') return id
  }
  return null
}

export const Resources: CollectionConfig<'posts'> = {
  slug: 'posts',
  labels: {
    singular: 'Resource',
    plural: 'Resources',
  },
  access: {
    create: authenticatedCreateResourceEnglishLocaleOnly,
    delete: adminOnlyDeleteAccess,
    read: authenticatedOrPublished,
    update: authenticated,
  },
  // This config controls what's populated by default when a post is referenced
  // https://payloadcms.com/docs/queries/select#defaultpopulate-collection-config-property
  // Type safe if the collection slug generic is passed to `CollectionConfig` - `CollectionConfig<'posts'>
  defaultPopulate: {
    title: true,
    slug: true,
    categorySections: true,
    citations: true,
    meta: {
      image: true,
      description: true,
    },
  },
  admin: {
    group: 'Collections',
    // Without this, the admin list loads full documents (all blocks/arrays). That can generate huge SQL
    // and hang or time out on production Postgres (Neon + Vercel) while local still feels fine.
    enableListViewSelectAPI: true,
    defaultColumns: ['title', 'note', 'slug', 'updatedAt'],
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({
          slug: data?.slug,
          collection: 'posts',
          req,
        }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: data?.slug as string,
        collection: 'posts',
        req,
      }),
    useAsTitle: 'title',
    components: {
      edit: {
        /** Mount hook — UI portaled before Live Preview / Preview; see TranslateAllButton.client.tsx */
        beforeDocumentControls:
          '@/collections/Resources/components/TranslateAllButton.client#TranslateAllButton',
      },
    },
  },
  fields: markLocalized([
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
            },
            {
              name: 'specialties',
              type: 'select',
              label: 'Specialties',
              hasMany: true,
              options: [...RESOURCE_SPECIALTY_OPTIONS],
              admin: {
                description: 'Select one or more specialties that apply to this resource.',
                isClearable: true,
              },
            },
            {
              name: 'coverImage',
              type: 'upload',
              relationTo: 'media',
              required: true,
            },
            {
              name: 'benefits',
              type: 'array',
              labels: {
                singular: 'Benefit Tag',
                plural: 'Benefit Tags',
              },
              fields: [
                {
                  name: 'icon',
                  type: 'upload',
                  relationTo: 'media',
                  required: true,
                },
                {
                  name: 'title',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'description',
                  type: 'textarea',
                  required: true,
                },
              ],
            },
            {
              name: 'categorySections',
              type: 'array',
              labels: {
                singular: 'Category Section',
                plural: 'Category Sections',
              },
              minRows: 1,
              maxRows: 5,
              validate: (value) => {
                const sections = Array.isArray(value)
                  ? (value as Array<{ category?: unknown }>)
                  : []

                if (sections.length === 0) {
                  return 'Add at least one category section.'
                }

                const sectionCategories = sections
                  .map((item) => normalizeRelationshipValue(item?.category))
                  .filter((category): category is string | number => category !== null)

                if (sectionCategories.length === 0 || sectionCategories.length > 5) {
                  return 'Select between 1 and 5 categories across sections.'
                }

                if (new Set(sectionCategories).size !== sectionCategories.length) {
                  return 'Each category can only have one section.'
                }

                return true
              },
              fields: [
                {
                  name: 'category',
                  type: 'relationship',
                  relationTo: 'categories',
                  admin: {
                    allowCreate: false,
                    allowEdit: false,
                  },
                  filterOptions: (({
                    data,
                    siblingData,
                  }: {
                    data?: unknown
                    siblingData?: unknown
                  }) => {
                    const doc = (data ?? {}) as {
                      categorySections?: Array<{ category?: unknown }>
                    }
                    const currentRow = (siblingData ?? {}) as { category?: unknown }
                    const currentRowCategory = normalizeRelationshipValue(currentRow.category)

                    const selectedInOtherSections = (doc.categorySections ?? [])
                      .map((section) => normalizeRelationshipValue(section?.category))
                      .filter((category): category is string | number => category !== null)
                      .filter((category) => category !== currentRowCategory)

                    const where: Record<string, unknown> = {
                      and: [
                        {
                          slug: {
                            in: FIXED_CATEGORY_SLUGS,
                          },
                        },
                      ],
                    }

                    if (selectedInOtherSections.length > 0) {
                      ;(where.and as Array<Record<string, unknown>>).push({
                        id: {
                          not_in: selectedInOtherSections,
                        },
                      })
                    }

                    return where
                  }) as any,
                  required: true,
                  validate: (value: unknown, { data }: { data?: unknown }) => {
                    if (!value) return 'Category is required.'

                    const doc = (data ?? {}) as {
                      categorySections?: Array<{ category?: unknown }>
                    }
                    const sections = Array.isArray(doc.categorySections) ? doc.categorySections : []
                    const currentCategory = normalizeRelationshipValue(value)
                    const occurrences = sections.filter(
                      (section) =>
                        normalizeRelationshipValue(section?.category) === currentCategory,
                    ).length

                    if (occurrences > 1) {
                      return 'This category is already used in another section.'
                    }

                    return true
                  },
                },
                {
                  name: 'content',
                  type: 'richText',
                  required: true,
                  admin: {
                    components: {
                      beforeInput:
                        '@/collections/Resources/components/StaleLocalizedRichTextResetBeforeInput.client#StaleLocalizedRichTextResetBeforeInput',
                    },
                  },
                  editor: lexicalEditor({
                    features: ({ rootFeatures }) => {
                      return [
                        ...rootFeatures,
                        HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4', 'h5'] }),
                        BlocksFeature({
                          blocks: [
                            Banner,
                            MediaBlock,
                            TwoColumnImagesBlock,
                            FloatImageBlock,
                            DoDontCardBlock,
                            DropdownBlock,
                            TimelineBlock,
                            ToDoListBlock,
                            ProcedureTypeCardBlock,
                          ],
                          inlineBlocks: [ChapterCitationBlock],
                        }),
                        OrderedListFeature(),
                        UnorderedListFeature(),
                        FixedToolbarFeature(),
                        InlineToolbarFeature(),
                        HorizontalRuleFeature(),
                        EXPERIMENTAL_TableFeature(),
                      ]
                    },
                  }),
                },
              ],
            },
            {
              name: 'questionsToAskDoctor',
              label: 'Questions to ask your doctor',
              type: 'richText',
              required: false,
              editor: lexicalEditor({
                features: [
                  ParagraphFeature(),
                  OrderedListFeature(),
                  UnorderedListFeature(),
                  BoldFeature(),
                  ItalicFeature(),
                  LinkFeature({
                    enabledCollections: ['pages', 'posts'],
                  }),
                  BlocksFeature({
                    blocks: [DropdownBlock],
                    inlineBlocks: [ChapterCitationBlock],
                  }),
                  FixedToolbarFeature(),
                  InlineToolbarFeature(),
                ],
              }),
            },
          ],
        },
        {
          label: 'Citations',
          fields: [
            {
              name: 'citations',
              type: 'array',
              labels: { singular: 'Citation', plural: 'Citations' },
              admin: {
                description:
                  'Bibliography sources for this resource. Insert inline citation markers in the body and pick the matching source here (internal ids are generated automatically). Legacy link-based citations convert when you save.',
                components: {
                  RowLabel: '@/collections/Resources/CitationsRowLabel#CitationsRowLabel',
                },
              },
              fields: [
                {
                  name: 'key',
                  type: 'text',
                  required: true,
                  label: 'Key',
                  // UUID, identical across locales. Localizing it would silently
                  // break inline citation references in ES that point to EN keys.
                  localized: false,
                  admin: {
                    hidden: true,
                  },
                  hooks: {
                    beforeValidate: [
                      async ({ value }) => {
                        const v = typeof value === 'string' ? value.trim() : ''
                        if (v) return v
                        return randomUUID()
                      },
                    ],
                  },
                },
                {
                  name: 'bibliography',
                  type: 'textarea',
                  required: true,
                  label: 'Bibliography line',
                },
                {
                  name: 'url',
                  type: 'text',
                  required: false,
                  label: 'URL',
                  admin: {
                    description: 'Optional. Omit when there is no web source.',
                  },
                },
              ],
            },
          ],
        },
        {
          name: 'meta',
          label: 'SEO',
          fields: [
            OverviewField({
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
              imagePath: 'meta.image',
            }),
            MetaTitleField({
              hasGenerateFn: true,
            }),
            MetaImageField({
              relationTo: 'media',
            }),

            MetaDescriptionField({}),
            PreviewField({
              // if the `generateUrl` function is configured
              hasGenerateFn: true,

              // field paths to match the target field for data
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
            }),
          ],
        },
      ],
    },
    {
      name: 'note',
      type: 'textarea',
      label: 'Note',
      localized: false,
      admin: {
        position: 'sidebar',
        className: 'resource-editor-note',
        rows: 2,
        description:
          'Internal editor note. Shown in the admin list only — not included on the public resource page or for anonymous API readers.',
      },
      access: {
        read: ({ req: { user } }) => Boolean(user),
      },
    },
    {
      name: 'lastUpdatedOn',
      type: 'date',
      label: 'Last updated date',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
        },
        position: 'sidebar',
        description:
          'Optional. When set, this date is shown instead of the published date, with an icon and hover details.',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      label: 'Published at',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
        description:
          'Publication date and time. The resource hero shows the calendar day from this value. When you publish and this is empty, it is set automatically.',
      },
      hooks: {
        beforeChange: [
          ({ siblingData, value }) => {
            if (siblingData._status === 'published' && !value) {
              return new Date()
            }
            return value
          },
        ],
      },
    },
    {
      name: 'authors',
      type: 'relationship',
      admin: {
        position: 'sidebar',
      },
      hasMany: true,
      relationTo: 'users',
    },
    // This field is only used to populate the user data via the `populateAuthors` hook
    // This is because the `user` collection has access control locked to protect user privacy
    // GraphQL will also not return mutated user data that differs from the underlying schema
    {
      name: 'populatedAuthors',
      type: 'array',
      access: {
        update: () => false,
      },
      admin: {
        disabled: true,
        readOnly: true,
      },
      fields: [
        // Derived from the authors relationship; identical across locales.
        { name: 'id', type: 'text', localized: false },
        { name: 'name', type: 'text', localized: false },
      ],
    },
    // Slugs are localized so /resources/<en-slug> and /es/resources/<es-slug>
    // can resolve to the same document with different per-locale URLs.
    slugField({ localized: true }),
    {
      name: 'spanishMirrorsEnglish',
      type: 'checkbox',
      label: 'Spanish mirrors English (internal)',
      defaultValue: true,
      localized: false,
      admin: {
        hidden: true,
      },
    },
    {
      name: 'translatedAt',
      type: 'date',
      label: 'Last translated at',
      // Stamped by the Phase 3 "Translate all" action whenever DeepL fills in
      // the ES locale. Compared against `enUpdatedAt` to detect stale ES fields.
      localized: false,
      admin: {
        position: 'sidebar',
        readOnly: true,
        date: { pickerAppearance: 'dayAndTime' },
        condition: (_data, _sibling, { user }) => isAdminRole(user as User | undefined),
        description:
          'Set automatically when an editor runs Translate all to ES. Used to flag Spanish fields as stale when the English source has been edited since.',
      },
    },
    {
      name: 'enUpdatedAt',
      type: 'date',
      label: 'EN last updated at',
      // Stamped by the trackEnUpdatedAt afterChange hook on every EN save.
      localized: false,
      admin: {
        position: 'sidebar',
        readOnly: true,
        date: { pickerAppearance: 'dayAndTime' },
        condition: (_data, _sibling, { user }) => isAdminRole(user as User | undefined),
        description:
          'Set automatically on every English save. Used together with Last translated at to flag Spanish fields as stale.',
      },
    },
  ]),
  hooks: {
    beforeChange: [deduplicateArrayRowIds],
    beforeValidate: [validateResourceCitations],
    // syncEnglishToSpanish mirrors EN → ES before stamping EN timestamps.
    // stampSpanishMirroringStop detects manual ES edits and disables mirroring.
    // trackEnUpdatedAt stamps EN last; revalidatePost clears ISR after everything commits.
    afterChange: [
      syncEnglishToSpanish,
      stampSpanishMirroringStop,
      trackEnUpdatedAt,
      revalidatePost,
    ],
    afterRead: [
      mergeEnglishIntoSpanishAdminRead,
      migrateLegacyCitationsAfterRead,
      populateAuthors,
    ],
    afterDelete: [revalidateDelete],
    afterOperation: [mergeEnglishListColumnsAfterFind],
  },
  endpoints: [translateResourceEndpoint],
  versions: {
    drafts: {
      autosave: {
        // Payload default is 2000 ms; ~100 ms stacks overlapping saves with heavy afterChange hooks.
        interval: 2000,
      },
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
}

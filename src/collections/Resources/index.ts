import type { CollectionConfig } from 'payload'

import {
  BlocksFeature,
  EXPERIMENTAL_TableFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  OrderedListFeature,
  UnorderedListFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { authenticated } from '../../access/authenticated'
import { authenticatedOrPublished } from '../../access/authenticatedOrPublished'
import { Banner } from '../../blocks/Banner/config'
import { Code } from '../../blocks/Code/config'
import { DoDontCardBlock } from '../../blocks/DoDontCard/config'
import { DropdownBlock } from '../../blocks/Dropdown/config'
import { FloatImageBlock } from '../../blocks/FloatImage/config'
import { InfoBoxBlock } from '../../blocks/InfoBox/config'
import { MediaBlock } from '../../blocks/MediaBlock/config'
import { TimelineBlock } from '../../blocks/Timeline/config'
import { ToDoListBlock } from '../../blocks/ToDoList/config'
import { TwoColumnImagesBlock } from '../../blocks/TwoColumnImages/config'
import { generatePreviewPath } from '../../utilities/generatePreviewPath'
import { populateAuthors } from './hooks/populateAuthors'
import { revalidateDelete, revalidatePost } from './hooks/revalidatePost'

import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'
import { slugField } from 'payload'

const FIXED_CATEGORY_SLUGS = ['educatin', 'pre-op', 'operation-day', 'post-op', 'next-steps']

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
    create: authenticated,
    delete: authenticated,
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
    meta: {
      image: true,
      description: true,
    },
  },
  admin: {
    group: 'Collections',
    defaultColumns: ['title', 'slug', 'updatedAt'],
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
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      type: 'tabs',
      tabs: [
        {
          fields: [
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
                  editor: lexicalEditor({
                    features: ({ rootFeatures }) => {
                      return [
                        ...rootFeatures,
                        HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4', 'h5'] }),
                        BlocksFeature({
                          blocks: [
                            Banner,
                            Code,
                            MediaBlock,
                            TwoColumnImagesBlock,
                            FloatImageBlock,
                            DoDontCardBlock,
                            InfoBoxBlock,
                            DropdownBlock,
                            TimelineBlock,
                            ToDoListBlock,
                          ],
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
          ],
          label: 'Content',
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
      name: 'publishedAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
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
        {
          name: 'id',
          type: 'text',
        },
        {
          name: 'name',
          type: 'text',
        },
      ],
    },
    slugField(),
  ],
  hooks: {
    afterChange: [revalidatePost],
    afterRead: [populateAuthors],
    afterDelete: [revalidateDelete],
  },
  versions: {
    drafts: {
      autosave: {
        interval: 100, // We set this interval for optimal live preview
      },
      schedulePublish: true,
    },
    maxPerDoc: 50,
  },
}

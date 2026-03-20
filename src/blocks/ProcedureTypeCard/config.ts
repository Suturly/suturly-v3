import type { Block } from 'payload'
import {
  BoldFeature,
  FixedToolbarFeature,
  InlineToolbarFeature,
  ItalicFeature,
  LinkFeature,
  OrderedListFeature,
  ParagraphFeature,
  UnorderedListFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

export const ProcedureTypeCardBlock: Block = {
  slug: 'procedureTypeCard',
  interfaceName: 'ProcedureTypeCardBlock',
  labels: {
    singular: 'Procedure type card',
    plural: 'Procedure type cards',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'chips',
      type: 'array',
      labels: {
        singular: 'Chip',
        plural: 'Chips',
      },
      admin: {
        initCollapsed: true,
      },
      fields: [
        {
          name: 'icon',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'label',
          type: 'text',
          required: true,
        },
        {
          name: 'hint',
          type: 'textarea',
          required: true,
          label: 'Hint (shown on info hover)',
        },
      ],
    },
    {
      name: 'shortDescription',
      type: 'textarea',
      required: false,
      label: 'Short description',
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: false,
    },
    {
      name: 'additionalContent',
      type: 'richText',
      required: false,
      label: 'Additional content (e.g. pros & cons)',
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
          FixedToolbarFeature(),
          InlineToolbarFeature(),
        ],
      }),
    },
  ],
}

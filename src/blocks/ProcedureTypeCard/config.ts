import type { Block } from 'payload'
import {
  BoldFeature,
  BlocksFeature,
  FixedToolbarFeature,
  InlineToolbarFeature,
  ItalicFeature,
  LinkFeature,
  OrderedListFeature,
  ParagraphFeature,
  UnderlineFeature,
  UnorderedListFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { ChapterCitationBlock } from '../ChapterCitation/config'

const procedureShortDescriptionLexical = lexicalEditor({
  features: [
    ParagraphFeature(),
    OrderedListFeature(),
    UnorderedListFeature(),
    BoldFeature(),
    ItalicFeature(),
    UnderlineFeature(),
    BlocksFeature({
      inlineBlocks: [ChapterCitationBlock],
    }),
    FixedToolbarFeature(),
    InlineToolbarFeature(),
  ],
})

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
      type: 'richText',
      required: false,
      label: 'Short description',
      admin: {
        description:
          'Optional. Bold, italic, underline, bullet/numbered lists, and inline citations. No links or headings.',
      },
      editor: procedureShortDescriptionLexical,
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
      admin: {
        description: 'Optional. Leave empty if this card does not need a “Show more” section.',
      },
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
            inlineBlocks: [ChapterCitationBlock],
          }),
          FixedToolbarFeature(),
          InlineToolbarFeature(),
        ],
      }),
    },
  ],
}

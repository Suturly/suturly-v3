import type { Block } from 'payload'

import {
  BoldFeature,
  BlocksFeature,
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  ItalicFeature,
  LinkFeature,
  OrderedListFeature,
  ParagraphFeature,
  UnorderedListFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { ChapterCitationBlock } from '../ChapterCitation/config'

export const Banner: Block = {
  slug: 'banner',
  fields: [
    {
      name: 'style',
      type: 'select',
      defaultValue: 'info',
      options: [
        { label: 'Info', value: 'info' },
        { label: 'Warning', value: 'warning' },
      ],
      required: true,
    },
    {
      name: 'content',
      type: 'richText',
      editor: lexicalEditor({
        features: [
          ParagraphFeature(),
          HeadingFeature({ enabledHeadingSizes: ['h5'] }),
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
      label: false,
      required: true,
    },
  ],
  interfaceName: 'BannerBlock',
}

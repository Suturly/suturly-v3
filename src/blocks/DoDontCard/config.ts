import type { Block } from 'payload'
import {
  BoldFeature,
  BlocksFeature,
  FixedToolbarFeature,
  InlineToolbarFeature,
  ItalicFeature,
  LinkFeature,
  ParagraphFeature,
  UnorderedListFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { ChapterCitationBlock } from '../ChapterCitation/config'

export const DoDontCardBlock: Block = {
  slug: 'doDontCard',
  interfaceName: 'DoDontCardBlock',
  labels: {
    singular: 'Good/Baad card',
    plural: 'Good/Baad cards',
  },
  fields: [
    {
      name: 'type',
      type: 'select',
      options: [
        { label: 'Do', value: 'do' },
        { label: 'Don`t', value: 'dont' },
      ],
      defaultValue: 'do',
      required: true,
    },
    {
      name: 'title',
      type: 'text',
      required: false,
    },
    {
      name: 'content',
      type: 'richText',
      required: false,
      editor: lexicalEditor({
        features: [
          ParagraphFeature(),
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
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: false,
    },
  ],
}

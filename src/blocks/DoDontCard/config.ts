import type { Block } from 'payload'
import {
  BoldFeature,
  FixedToolbarFeature,
  InlineToolbarFeature,
  ItalicFeature,
  LinkFeature,
  ParagraphFeature,
  UnorderedListFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

export const DoDontCardBlock: Block = {
  slug: 'doDontCard',
  interfaceName: 'DoDontCardBlock',
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

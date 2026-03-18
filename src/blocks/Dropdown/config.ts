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
  UnorderedListFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import { ToDoListBlock } from '../ToDoList/config'

export const DropdownBlock: Block = {
  slug: 'dropdown',
  interfaceName: 'DropdownBlock',
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
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
            blocks: [ToDoListBlock],
          }),
          FixedToolbarFeature(),
          InlineToolbarFeature(),
        ],
      }),
    },
  ],
}

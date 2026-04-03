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
import { Banner } from '../Banner/config'
import { DoDontCardBlock } from '../DoDontCard/config'
import { DropdownBlock } from '../Dropdown/config'
import { FloatImageBlock } from '../FloatImage/config'
import { MediaBlock } from '../MediaBlock/config'
import { ProcedureTypeCardBlock } from '../ProcedureTypeCard/config'
import { ToDoListBlock } from '../ToDoList/config'
import { ChapterCitationBlock } from '../ChapterCitation/config'
import { TwoColumnImagesBlock } from '../TwoColumnImages/config'

export const TimelineBlock: Block = {
  slug: 'timeline',
  interfaceName: 'TimelineBlock',
  fields: [
    {
      name: 'items',
      type: 'array',
      minRows: 1,
      required: true,
      labels: {
        singular: 'Timeline item',
        plural: 'Timeline items',
      },
      fields: [
        {
          name: 'timeLabel',
          type: 'text',
          required: true,
          label: 'Time label',
        },
        {
          name: 'content',
          type: 'richText',
          required: true,
          editor: lexicalEditor({
            features: [
              ParagraphFeature(),
              HeadingFeature({ enabledHeadingSizes: ['h4', 'h5'] }),
              OrderedListFeature(),
              UnorderedListFeature(),
              BoldFeature(),
              ItalicFeature(),
              LinkFeature({
                enabledCollections: ['pages', 'posts'],
              }),
              BlocksFeature({
                blocks: [
                  Banner,
                  MediaBlock,
                  TwoColumnImagesBlock,
                  FloatImageBlock,
                  DoDontCardBlock,
                  DropdownBlock,
                  ToDoListBlock,
                  ProcedureTypeCardBlock,
                ],
                inlineBlocks: [ChapterCitationBlock],
              }),
              FixedToolbarFeature(),
              InlineToolbarFeature(),
            ],
          }),
        },
      ],
    },
  ],
}

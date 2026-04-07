import {
  BoldFeature,
  BlocksFeature,
  ItalicFeature,
  LinkFeature,
  ParagraphFeature,
  lexicalEditor,
  UnderlineFeature,
} from '@payloadcms/richtext-lexical'

import { ChapterCitationBlock } from '@/blocks/ChapterCitation/config'
import { StripHeadingFormatsFeature } from '@/features/stripHeadingFormats'

export const defaultLexical = lexicalEditor({
  features: [
    ParagraphFeature(),
    UnderlineFeature(),
    BoldFeature(),
    ItalicFeature(),
    LinkFeature({
      enabledCollections: ['pages', 'posts'],
    }),
    BlocksFeature({
      inlineBlocks: [ChapterCitationBlock],
    }),
    StripHeadingFormatsFeature(),
  ],
})

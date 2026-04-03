import type { Block } from 'payload'

export const ChapterCitationBlock: Block = {
  slug: 'chapterCitation',
  interfaceName: 'ChapterCitationBlock',
  labels: {
    singular: 'Citation',
    plural: 'Citations',
  },
  admin: {
    components: {
      Label: '@/blocks/ChapterCitation/InlineLabel#ChapterCitationInlineLabel',
    },
  },
  fields: [
    {
      name: 'refKey',
      type: 'text',
      required: true,
      label: 'Citation',
      admin: {
        description:
          'Pick an existing source from this resource’s Citations tab, or create one here. Reuse the same entry when citing one source multiple times.',
        components: {
          Field: '@/fields/CitationRefKey/Field#CitationRefKeyField',
        },
      },
    },
  ],
}

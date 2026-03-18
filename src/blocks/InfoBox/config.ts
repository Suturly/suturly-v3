import type { Block } from 'payload'

export const InfoBoxBlock: Block = {
  slug: 'infoBox',
  interfaceName: 'InfoBoxBlock',
  fields: [
    {
      name: 'title',
      type: 'text',
      required: false,
    },
    {
      name: 'description',
      type: 'textarea',
      required: false,
    },
  ],
}

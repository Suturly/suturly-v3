import type { Block } from 'payload'

export const TwoColumnImagesBlock: Block = {
  slug: 'twoColumnImages',
  interfaceName: 'TwoColumnImagesBlock',
  fields: [
    {
      name: 'leftImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'rightImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
  ],
}

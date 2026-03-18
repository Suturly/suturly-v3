import type { Block } from 'payload'

export const FloatImageBlock: Block = {
  slug: 'floatImage',
  interfaceName: 'FloatImageBlock',
  fields: [
    {
      name: 'media',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'float',
      type: 'select',
      defaultValue: 'right',
      options: [
        { label: 'Right', value: 'right' },
        { label: 'Left', value: 'left' },
      ],
      required: true,
    },
  ],
}

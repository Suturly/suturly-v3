import type { Block } from 'payload'
import { FixedToolbarFeature, InlineToolbarFeature, lexicalEditor } from '@payloadcms/richtext-lexical'

const captionEditor = lexicalEditor({
  features: ({ rootFeatures }) => [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()],
})

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
      name: 'leftCustomCaption',
      type: 'richText',
      required: false,
      label: 'Left custom caption',
      admin: {
        description:
          'Optional. When set, replaces the left image’s Media library caption. Leave empty to use the library caption, or hide if the library has no caption.',
      },
      editor: captionEditor,
    },
    {
      name: 'rightImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'rightCustomCaption',
      type: 'richText',
      required: false,
      label: 'Right custom caption',
      admin: {
        description:
          'Optional. When set, replaces the right image’s Media library caption. Leave empty to use the library caption, or hide if the library has no caption.',
      },
      editor: captionEditor,
    },
  ],
}

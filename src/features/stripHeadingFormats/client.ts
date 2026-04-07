'use client'

import { createClientFeature } from '@payloadcms/richtext-lexical/client'

import { StripHeadingFormatsPlugin } from './Plugin'

export const StripHeadingFormatsFeatureClient = createClientFeature({
  plugins: [
    {
      Component: StripHeadingFormatsPlugin,
      position: 'normal',
    },
  ],
})

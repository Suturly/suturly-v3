import { createServerFeature } from '@payloadcms/richtext-lexical'

export const StripHeadingFormatsFeature = createServerFeature({
  key: 'stripHeadingFormats',
  feature: {
    ClientFeature: '@/features/stripHeadingFormats/client#StripHeadingFormatsFeatureClient',
  },
})

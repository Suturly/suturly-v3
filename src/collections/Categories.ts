import type { CollectionConfig } from 'payload'

import { authenticated } from '../access/authenticated'
import { slugField } from 'payload'

const FIXED_CATEGORY_SLUGS = ['educatin', 'pre-op', 'operation-day', 'post-op', 'next-steps']

const NEXT_STEP_DEFAULTS: Record<string, { description: string; title: string }> = {
  educatin: {
    title: 'Understand your treatment timeline',
    description: 'Review pre-operative preparation to reduce risks and improve recovery.',
  },
  'pre-op': {
    title: 'Get ready for operation day',
    description: 'Follow surgery-day instructions so your procedure can start safely and on time.',
  },
  'operation-day': {
    title: 'Plan your post-op recovery',
    description: 'Know what to expect in the first recovery phase and when to contact your surgeon.',
  },
  'post-op': {
    title: 'Prepare your next steps',
    description: 'Track milestones, warning signs, and long-term care recommendations.',
  },
  'next-steps': {
    title: 'Continue your long-term follow-up',
    description: 'Keep regular check-ins and discuss any changes with your doctor.',
  },
}

export const Categories: CollectionConfig = {
  slug: 'categories',
  access: {
    create: () => false,
    delete: () => false,
    read: () => ({
      slug: {
        in: FIXED_CATEGORY_SLUGS,
      },
    }),
    update: authenticated,
  },
  admin: {
    hidden: false,
    useAsTitle: 'title',
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data || typeof data !== 'object') return data

        const nextData = { ...(data as Record<string, unknown>) }
        const slug = typeof nextData.slug === 'string' ? nextData.slug : ''
        const defaults = NEXT_STEP_DEFAULTS[slug]
        if (!defaults) return data

        if (typeof nextData.nextStepBannerTitle !== 'string' || !nextData.nextStepBannerTitle.trim()) {
          nextData.nextStepBannerTitle = defaults.title
        }

        if (
          typeof nextData.nextStepBannerDescription !== 'string' ||
          !nextData.nextStepBannerDescription.trim()
        ) {
          nextData.nextStepBannerDescription = defaults.description
        }

        return nextData
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'nextStepBannerTitle',
      type: 'text',
      admin: {
        description:
          "Shown in the previous chapter's Next step banner (based on section order in a resource).",
      },
    },
    {
      name: 'nextStepBannerDescription',
      type: 'textarea',
      admin: {
        description:
          "Shown in the previous chapter's Next step banner (based on section order in a resource).",
      },
    },
    slugField({
      position: undefined,
    }),
  ],
}

import type { CollectionConfig } from 'payload'

/**
 * Localized: `title`, `nextStepBannerTitle`, `nextStepBannerDescription` (per EN/ES).
 * Shared: `slug` (relationship keys). After pulling these schema changes, run
 * `payload migrate:create` (or `payload migrate`) against your database so Postgres
 * matches Payload’s locale tables.
 */
import { adminOnlyAccess } from '../access/roles'
import { slugField } from 'payload'
import { createBreadcrumbsField } from '@payloadcms/plugin-nested-docs'

const FIXED_CATEGORY_SLUGS = ['educatin', 'pre-op', 'operation-day', 'post-op', 'next-steps']

const NEXT_STEP_DEFAULTS_EN: Record<string, { description: string; title: string }> = {
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

const NEXT_STEP_DEFAULTS_ES: Record<string, { description: string; title: string }> = {
  educatin: {
    title: 'Comprenda la línea de tiempo de su tratamiento',
    description:
      'Revise la preparación preoperatoria para reducir riesgos y mejorar la recuperación.',
  },
  'pre-op': {
    title: 'Prepárese para el día de la operación',
    description:
      'Siga las indicaciones del día de la cirugía para que el procedimiento sea seguro y a tiempo.',
  },
  'operation-day': {
    title: 'Planifique su recuperación postoperatoria',
    description:
      'Sepa qué esperar en la primera fase de recuperación y cuándo contactar a su cirujano.',
  },
  'post-op': {
    title: 'Prepare sus próximos pasos',
    description:
      'Haga seguimiento a hitos, señales de alerta y recomendaciones de cuidado a largo plazo.',
  },
  'next-steps': {
    title: 'Continúe su seguimiento a largo plazo',
    description: 'Mantenga sus controles y comente cualquier cambio con su médico.',
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
    update: adminOnlyAccess,
  },
  admin: {
    hidden: false,
    useAsTitle: 'title',
  },
  hooks: {
    beforeValidate: [
      ({ data, req }) => {
        if (!data || typeof data !== 'object') return data

        const nextData = { ...(data as Record<string, unknown>) }
        const slug = typeof nextData.slug === 'string' ? nextData.slug : ''
        const locale = req?.locale === 'es' ? 'es' : 'en'
        const defaults = locale === 'es' ? NEXT_STEP_DEFAULTS_ES[slug] : NEXT_STEP_DEFAULTS_EN[slug]
        if (!defaults) return data

        if (
          typeof nextData.nextStepBannerTitle !== 'string' ||
          !nextData.nextStepBannerTitle.trim()
        ) {
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
      localized: true,
    },
    {
      name: 'nextStepBannerTitle',
      type: 'text',
      localized: true,
      admin: {
        description:
          "Shown in the previous chapter's Next step banner (based on section order in a resource).",
      },
    },
    {
      name: 'nextStepBannerDescription',
      type: 'textarea',
      localized: true,
      admin: {
        description:
          "Shown in the previous chapter's Next step banner (based on section order in a resource).",
      },
    },
    slugField({
      position: undefined,
      localized: false,
    }),
    // Categories: `breadcrumbs` must stay un-localized so nested-docs does not inject a localized variant.
    createBreadcrumbsField('categories', { localized: false }),
  ],
}

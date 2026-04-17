import type { GlobalConfig } from 'payload'

import { adminOnlyAccess, isAdminRole } from '@/access/roles'
import type { User } from '@/payload-types'

/**
 * Marketing-only settings (public read for the website; edits in Admin).
 * Links the “Get in touch” modal to a Form Builder document.
 */
export const Marketing: GlobalConfig = {
  slug: 'marketing',
  label: 'Marketing',
  admin: {
    hidden: ({ user }) => !isAdminRole(user as User | undefined),
  },
  access: {
    read: () => true,
    update: adminOnlyAccess,
  },
  fields: [
    {
      name: 'partnerContactForm',
      type: 'relationship',
      relationTo: 'forms',
      required: true,
      admin: {
        description:
          'Form used by the marketing “Get in touch” modal. Field names must be: name, email, message.',
      },
    },
  ],
}

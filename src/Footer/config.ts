import type { GlobalConfig } from 'payload'

import { link } from '@/fields/link'
import { adminOnlyAccess, isAdminRole } from '@/access/roles'
import type { User } from '@/payload-types'
import { revalidateFooter } from './hooks/revalidateFooter'

export const Footer: GlobalConfig = {
  slug: 'footer',
  admin: {
    hidden: ({ user }) => !isAdminRole(user as User | undefined),
  },
  access: {
    read: () => true,
    update: adminOnlyAccess,
  },
  fields: [
    {
      name: 'navItems',
      type: 'array',
      fields: [
        link({
          appearances: false,
        }),
      ],
      maxRows: 6,
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: '@/Footer/RowLabel#RowLabel',
        },
      },
    },
  ],
  hooks: {
    afterChange: [revalidateFooter],
  },
}

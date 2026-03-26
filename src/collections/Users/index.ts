import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import {
  adminOnlyAccess,
  isAdminRole,
  userRoleFieldCreateAccess,
  userRoleFieldUpdateAccess,
  usersCreateAccess,
} from '../../access/roles'
import type { User } from '@/payload-types'

export const Users: CollectionConfig = {
  slug: 'users',
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        if (!data || typeof data !== 'object') return data
        const next = { ...(data as Record<string, unknown>) }
        if (operation === 'create') {
          const { totalDocs } = await req.payload.count({
            collection: 'users',
            overrideAccess: true,
          })
          if (totalDocs === 0) {
            next.role = 'admin'
            return next as typeof data
          }
          if (isAdminRole(req.user as User | undefined)) {
            const r = next.role
            if (r === undefined || r === null || r === '') {
              next.role = 'content_creator'
            }
          }
        }
        return next as typeof data
      },
    ],
  },
  access: {
    admin: authenticated,
    create: usersCreateAccess,
    delete: adminOnlyAccess,
    read: ({ req: { user } }) => {
      if (!user) return false
      if (isAdminRole(user)) return true
      return {
        id: {
          equals: user.id,
        },
      }
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      if (isAdminRole(user)) return true
      return {
        id: {
          equals: user.id,
        },
      }
    },
  },
  admin: {
    group: 'Plugins',
    defaultColumns: ['name', 'email', 'role'],
    useAsTitle: 'name',
    hidden: ({ user }) => !isAdminRole(user as User | undefined),
  },
  auth: true,
  fields: [
    {
      name: 'role',
      type: 'select',
      required: false,
      defaultValue: 'content_creator',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Content creator', value: 'content_creator' },
      ],
      access: {
        create: userRoleFieldCreateAccess,
        update: userRoleFieldUpdateAccess,
      },
    },
    {
      name: 'name',
      type: 'text',
    },
  ],
  timestamps: true,
}

import type { Access, AccessArgs, FieldAccess } from 'payload'

import type { User } from '@/payload-types'

/**
 * Admins: explicit `admin`, or legacy users created before `role` existed (treated as admin).
 * Content creators: explicit `content_creator` only.
 */
export function isAdminRole(user: User | null | undefined): boolean {
  if (!user) return false
  if (user.role === 'content_creator') return false
  return true
}

/** Collection access: create/update/delete restricted to admins (see Users for first-user exception). */
export const adminOnlyAccess: Access<User> = ({ req: { user } }) => isAdminRole(user)

/** Delete posts or media: admins only; content creators cannot remove records. */
export const adminOnlyDeleteAccess: Access<User> = ({ req: { user } }) => isAdminRole(user)

/** Only admins may change `role`. First signup (no session) may submit without role; hook sets admin. */
export const userRoleFieldUpdateAccess: FieldAccess<User> = ({ req: { user } }) => isAdminRole(user)

export const userRoleFieldCreateAccess: FieldAccess<User> = ({ req: { user } }) =>
  Boolean(isAdminRole(user) || !user)

/** Allow first registered user when the database has no users yet (Payload admin signup). */
export async function usersCreateAccess({ req }: AccessArgs<User>): Promise<boolean> {
  if (isAdminRole(req.user)) return true
  try {
    const { totalDocs } = await req.payload.count({
      collection: 'users',
      overrideAccess: true,
    })
    if (totalDocs === 0) return true
  } catch {
    // fail closed
  }
  return false
}

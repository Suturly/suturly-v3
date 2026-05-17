import type { AccessArgs } from 'payload'

import type { User } from '@/payload-types'

/**
 * Resources are authored in English first; Spanish follows mirroring / translation.
 * Admin passes `req.locale`, so “Create new” stays hidden while Spanish is selected.
 */
export const authenticatedCreateResourceEnglishLocaleOnly = ({
  req,
}: AccessArgs<User>): boolean => {
  return Boolean(req.user) && req.locale !== 'es'
}

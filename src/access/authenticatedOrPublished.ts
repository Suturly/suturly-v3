import type { Access } from 'payload'

import { isLocalePublished } from '@/utilities/localePublishStatus'

/** Logged-in users see all drafts; anonymous users only see published content for the request locale. */
export const authenticatedOrPublished: Access = ({ req: { user } }) => {
  if (user) {
    return true
  }

  return {
    _status: {
      equals: 'published',
    },
  }
}

/** Frontend helper when reading `_status` from a localized document. */
export function isPublishedForRequestLocale(status: unknown, locale: string): boolean {
  if (typeof status === 'object' && status !== null) {
    return isLocalePublished(status, locale)
  }
  return status === 'published'
}

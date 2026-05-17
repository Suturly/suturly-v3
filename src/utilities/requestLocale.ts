import { headers } from 'next/headers'

import {
  LOCALE_HEADER,
  type AppLocale,
  buildResourceDetailPath,
  buildResourcesListingPath,
} from './localeShared'

export type { AppLocale }
export { LOCALE_HEADER, buildResourceDetailPath, buildResourcesListingPath }

/**
 * Resolved locale for the current request — `es` after `/es/*` rewrite, otherwise `en`.
 * Default EN has no prefix in the browser URL (/resources, …).
 *
 * Server-only (`next/headers`). Client components should receive `AppLocale` as props
 * and import path helpers from `@/utilities/localeShared` instead of this module.
 */
export async function getRequestLocale(): Promise<AppLocale> {
  const headerList = await headers()
  if (headerList.get(LOCALE_HEADER) === 'es') return 'es'
  return 'en'
}

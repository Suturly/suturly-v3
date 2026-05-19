/** Middleware sets this on rewritten `/es/*` requests — keep in sync with `src/middleware.ts`. */
export const LOCALE_HEADER = 'x-locale'

/** Set from a language switcher; see `resourcesLocalePreference.ts`. */
export { LOCALE_PREFERENCE_COOKIE } from './resourcesLocalePreference'

export type AppLocale = 'en' | 'es'

export function buildResourcesListingPath(locale: AppLocale): string {
  return locale === 'es' ? '/es/resources' : '/resources'
}

export function buildResourceDetailPath(locale: AppLocale, slug: string): string {
  const enc = encodeURIComponent(slug)
  return locale === 'es' ? `/es/resources/${enc}` : `/resources/${enc}`
}

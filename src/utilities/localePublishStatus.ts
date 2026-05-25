export type LocaleStatusMap = Record<string, 'draft' | 'published'>

export type ResourceLocaleCode = 'en' | 'es'

const DEFAULT_LOCALES: ResourceLocaleCode[] = ['en', 'es']

/** Normalize document `_status` to a per-locale map (Payload localizeStatus or legacy scalar). */
export function ensureLocaleStatusObject(
  status: unknown,
  locales: ResourceLocaleCode[] = DEFAULT_LOCALES,
): Record<string, 'draft' | 'published'> {
  if (typeof status === 'object' && status !== null && !Array.isArray(status)) {
    const out: Record<string, 'draft' | 'published'> = {}
    for (const locale of locales) {
      const v = (status as Record<string, unknown>)[locale]
      out[locale] = v === 'published' ? 'published' : 'draft'
    }
    return out
  }
  const scalar = status === 'published' ? 'published' : 'draft'
  return Object.fromEntries(locales.map((locale) => [locale, scalar])) as Record<
    string,
    'draft' | 'published'
  >
}

export function isPublishingActiveLocale(
  data: { _status?: unknown },
  locale: string | undefined | null,
): boolean {
  const loc = locale && locale !== 'all' ? locale : 'en'
  return ensureLocaleStatusObject(data._status)[loc] === 'published'
}

export function isLocalePublished(status: unknown, locale: string): boolean {
  return ensureLocaleStatusObject(status)[locale] === 'published'
}

export function publishAllLocalesStatus(
  current: unknown,
  locales: ResourceLocaleCode[] = DEFAULT_LOCALES,
): Record<string, 'published'> {
  const base = ensureLocaleStatusObject(current, locales)
  for (const locale of locales) {
    base[locale] = 'published'
  }
  return base as Record<string, 'published'>
}

export function localeStatusChanged(prev: unknown, next: unknown, locale: string): boolean {
  return isLocalePublished(prev, locale) !== isLocalePublished(next, locale)
}

export function anyLocalePublished(status: unknown): boolean {
  return Object.values(ensureLocaleStatusObject(status)).some((v) => v === 'published')
}

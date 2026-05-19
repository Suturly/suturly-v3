/**
 * First-party cookie: when set to `en`, middleware will not auto-redirect
 * `/resources` to `/es/resources` based on Accept-Language. Set this when the
 * user explicitly chooses English (e.g. language switcher). Values: `en` | `es`.
 */
export const LOCALE_PREFERENCE_COOKIE = 'suturly_locale'

/** True when the highest-q language in Accept-Language is Spanish (`es`, `es-*`). */
export function prefersSpanishFromAcceptLanguage(
  acceptLanguage: string | null | undefined,
): boolean {
  if (!acceptLanguage?.trim()) return false

  const entries: { primary: string; q: number }[] = []
  for (const part of acceptLanguage.split(',')) {
    const trimmed = part.trim()
    if (!trimmed) continue
    const [range, ...params] = trimmed.split(';').map((s) => s.trim().toLowerCase())
    if (!range) continue
    let q = 1
    for (const p of params) {
      const [k, v] = p.split('=').map((s) => s.trim())
      if (k === 'q') {
        const n = Number.parseFloat(v)
        if (Number.isFinite(n)) q = Math.min(1, Math.max(0, n))
      }
    }
    const primary = range.split('-')[0] ?? ''
    if (!primary) continue
    entries.push({ primary, q })
  }

  if (entries.length === 0) return false

  entries.sort((a, b) => b.q - a.q)
  return entries[0]!.primary === 'es'
}

import { dequal } from 'dequal/lite'

/** Dot path with numeric segments for Payload arrays — matches REST `_locale` hydrated docs. */
export function readValueAtPath(root: Record<string, unknown>, pathSegments: string[]): unknown {
  let cur: unknown = root
  for (const seg of pathSegments) {
    if (cur === undefined || cur === null) return undefined
    if (/^\d+$/.test(seg)) {
      cur = Array.isArray(cur) ? cur[Number(seg)] : undefined
    } else if (typeof cur === 'object' && cur !== null && seg in (cur as object)) {
      cur = (cur as Record<string, unknown>)[seg]
    } else {
      return undefined
    }
  }
  return cur
}

function toTimestamp(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined
  if (typeof value === 'boolean') return undefined
  const ts = value instanceof Date ? value.getTime() : new Date(value as string | number).getTime()
  return Number.isNaN(ts) ? undefined : ts
}

/**
 * Spanish locale fields when EN changed after Translate all stamped {@link translatedAt},
 * or translatedAt is absent.
 */
export function isStaleSpanishAgainstEn(
  localeCode: string,
  translatedAt: unknown,
  enUpdatedAt: unknown,
): boolean {
  if (localeCode !== 'es') return false
  const t = toTimestamp(translatedAt)
  const e = toTimestamp(enUpdatedAt)
  if (t === undefined) return true
  if (e === undefined) return false
  return e > t
}

export function deepCloneForForm<T>(value: T): T {
  if (value === undefined) return value
  try {
    if (typeof structuredClone === 'function') {
      return structuredClone(value as T & object)
    }
  } catch {
    /* fall through */
  }
  try {
    return JSON.parse(JSON.stringify(value)) as T
  } catch {
    return value
  }
}

function isEmptyishScalar(value: unknown): boolean {
  return value === null || value === undefined || value === ''
}

/** Stable JSON clone so Lexical trees compare regardless of postgres key ordering. */
function jsonComparable(value: unknown): unknown {
  if (value === null || value === undefined) return value
  if (typeof value !== 'object') return value
  try {
    return JSON.parse(JSON.stringify(value))
  } catch {
    return value
  }
}

/** True when applying EN → ES reset would not change the stored form value. */
export function localizedFieldMatchesEnglish(current: unknown, english: unknown): boolean {
  if (isEmptyishScalar(current) && isEmptyishScalar(english)) return true

  if (
    typeof current !== 'object' ||
    current === null ||
    typeof english !== 'object' ||
    english === null
  ) {
    return Object.is(current, english)
  }

  return dequal(jsonComparable(current), jsonComparable(english))
}

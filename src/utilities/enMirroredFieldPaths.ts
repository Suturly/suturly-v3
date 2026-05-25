import { dequal } from 'dequal/lite'

import {
  deepCloneForForm,
  readValueAtPath,
} from '@/collections/Resources/components/staleLocalizedShared'

export function normalizeEnMirroredFieldPaths(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const out: string[] = []
  const seen = new Set<string>()
  for (const item of value) {
    if (typeof item !== 'string') continue
    const trimmed = item.trim()
    if (!trimmed || seen.has(trimmed)) continue
    seen.add(trimmed)
    out.push(trimmed)
  }
  return out
}

export function addEnMirroredFieldPath(paths: unknown, path: string): string[] {
  const trimmed = path.trim()
  if (!trimmed) return normalizeEnMirroredFieldPaths(paths)
  const normalized = normalizeEnMirroredFieldPaths(paths)
  if (normalized.includes(trimmed)) return normalized
  return [...normalized, trimmed]
}

export function removeEnMirroredFieldPaths(paths: unknown, toRemove: Iterable<string>): string[] {
  const removeSet = new Set<string>()
  for (const raw of toRemove) {
    const trimmed = raw.trim()
    if (trimmed) removeSet.add(trimmed)
  }
  if (removeSet.size === 0) return normalizeEnMirroredFieldPaths(paths)

  return normalizeEnMirroredFieldPaths(paths).filter(
    (mirrored) =>
      !removeSet.has(mirrored) &&
      ![...removeSet].some(
        (edited) =>
          mirrored === edited ||
          mirrored.startsWith(`${edited}.`) ||
          edited.startsWith(`${mirrored}.`),
      ),
  )
}

export function setValueAtPath(
  root: Record<string, unknown>,
  pathSegments: string[],
  value: unknown,
): void {
  if (pathSegments.length === 0) return

  let cur: unknown = root
  for (let i = 0; i < pathSegments.length - 1; i++) {
    const seg = pathSegments[i]!
    const isIndex = /^\d+$/.test(seg)
    const nextSeg = pathSegments[i + 1]!
    const nextIsIndex = /^\d+$/.test(nextSeg)

    if (isIndex) {
      const idx = Number(seg)
      if (!Array.isArray(cur)) return
      if (cur[idx] === undefined || cur[idx] === null) {
        cur[idx] = nextIsIndex ? [] : {}
      }
      cur = cur[idx]
    } else {
      if (typeof cur !== 'object' || cur === null || Array.isArray(cur)) return
      const obj = cur as Record<string, unknown>
      if (obj[seg] === undefined || obj[seg] === null) {
        obj[seg] = nextIsIndex ? [] : {}
      }
      cur = obj[seg]
    }
  }

  const last = pathSegments[pathSegments.length - 1]!
  const cloned = deepCloneForForm(value)

  if (/^\d+$/.test(last)) {
    if (!Array.isArray(cur)) return
    cur[Number(last)] = cloned
    return
  }

  if (typeof cur === 'object' && cur !== null && !Array.isArray(cur)) {
    ;(cur as Record<string, unknown>)[last] = cloned
  }
}

/** Diff localized mirror slices; returns Payload-style dot paths (e.g. `benefits.0.title`). */
export function collectChangedLocalizedPaths(prev: unknown, next: unknown, prefix = ''): string[] {
  if (dequal(prev, next)) return []

  const prevEmpty = prev === null || prev === undefined
  const nextEmpty = next === null || next === undefined

  if (prevEmpty || nextEmpty) {
    return prefix ? [prefix] : []
  }

  if (typeof prev !== 'object' || typeof next !== 'object') {
    return prefix ? [prefix] : []
  }

  if (Array.isArray(prev) && Array.isArray(next)) {
    const paths: string[] = []
    const maxLen = Math.max(prev.length, next.length)
    for (let i = 0; i < maxLen; i++) {
      const childPrefix = prefix ? `${prefix}.${i}` : String(i)
      paths.push(...collectChangedLocalizedPaths(prev[i], next[i], childPrefix))
    }
    return paths
  }

  if (Array.isArray(prev) || Array.isArray(next)) {
    return prefix ? [prefix] : []
  }

  const prevObj = prev as Record<string, unknown>
  const nextObj = next as Record<string, unknown>
  const keys = new Set([...Object.keys(prevObj), ...Object.keys(nextObj)])
  const paths: string[] = []

  for (const key of keys) {
    const childPrefix = prefix ? `${prefix}.${key}` : key
    paths.push(...collectChangedLocalizedPaths(prevObj[key], nextObj[key], childPrefix))
  }

  return paths
}

export { readValueAtPath }

/** Adapted from @jhb.software/payload-content-translator-plugin (MIT). */

export const isEmptyLexical = (value: unknown): boolean => {
  if (
    typeof value === 'object' &&
    value !== null &&
    'root' in value &&
    typeof (value as { root?: unknown }).root === 'object' &&
    (value as { root: { children?: unknown } }).root !== null &&
    'children' in (value as { root: { children?: unknown[] } }).root &&
    Array.isArray((value as { root: { children: unknown[] } }).root.children)
  ) {
    const root = (value as { root: { children: unknown[] } }).root
    if (root.children.length === 0) {
      return true
    }
    const first = root.children[0] as { children?: unknown[] }
    if (
      root.children.length === 1 &&
      first &&
      Array.isArray(first.children) &&
      first.children.length === 0
    ) {
      return true
    }
  }
  return false
}

export const isEmpty = (value: unknown): boolean => {
  if (Array.isArray(value)) {
    return value.length === 0
  }
  if (value === null || typeof value === 'undefined') {
    return true
  }
  if (typeof value === 'object' && value !== null && 'root' in value) {
    return isEmptyLexical(value)
  }
  if (typeof value === 'object' && value !== null && Object.keys(value).length === 0) {
    return true
  }
  return false
}

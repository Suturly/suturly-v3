/** Deep-walk any value (including Lexical JSON) and collect chapterCitation inline block ref keys. */
export function walkLexicalForCitationRefKeys(value: unknown, out: Set<string>): void {
  if (value === null || value === undefined) return
  if (typeof value !== 'object') return

  if (Array.isArray(value)) {
    for (const item of value) {
      walkLexicalForCitationRefKeys(item, out)
    }
    return
  }

  const o = value as Record<string, unknown>

  if (o.type === 'inlineBlock' && o.fields && typeof o.fields === 'object') {
    const f = o.fields as Record<string, unknown>
    if (f.blockType === 'chapterCitation' && typeof f.refKey === 'string') {
      const k = f.refKey.trim()
      if (k) out.add(k)
    }
  }

  for (const v of Object.values(o)) {
    walkLexicalForCitationRefKeys(v, out)
  }
}

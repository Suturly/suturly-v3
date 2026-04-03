import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'

export const CHAPTER_REF_OPEN_EVENT = 'suturly:chapter-ref-open'

export type ChapterRefOpenDetail = { id: number }

export type ChapterReference = {
  href: string
  id: number
  label: string
  bibliographyLine?: string | null
}

export type CitationRegistryEntry = {
  key: string
  bibliography: string
  url?: string | null
}

/** Citation hover hint and chapter references list use the same string. */
export function getChapterReferenceDisplay(ref: ChapterReference): string {
  return ref.bibliographyLine?.trim() || ref.label?.trim() || ref.href
}

export const normalizeChapterRefHref = (href: string): string => {
  const t = href.trim()
  if (!t) return t
  try {
    if (/^https?:\/\//i.test(t)) {
      const u = new URL(t)
      u.hash = ''
      u.hostname = u.hostname.toLowerCase()
      let out = u.toString()
      if (out.length > 1) out = out.replace(/\/$/, '')
      return out
    }
  } catch {
    /* invalid URL */
  }
  return t.length > 1 ? t.replace(/\/$/, '') : t
}

export type ChapterReferencesExtraction = {
  references: ChapterReference[]
  citationMap: Record<string, number>
  citationLinkLabels: Record<string, string>
  citationHrefs: Record<string, string>
}

type InlineBlockFields = {
  blockType?: unknown
  id?: unknown
  refKey?: unknown
}

function buildRegistryLookup(registry: CitationRegistryEntry[] | null | undefined): Map<string, CitationRegistryEntry> {
  const map = new Map<string, CitationRegistryEntry>()
  if (!Array.isArray(registry)) return map
  for (const row of registry) {
    const key = typeof row.key === 'string' ? row.key.trim() : ''
    if (key) map.set(key, row)
  }
  return map
}

const walk = (value: unknown, onInline: (blockId: string, refKey: string) => void): void => {
  if (!value) return

  if (Array.isArray(value)) {
    value.forEach((item) => walk(item, onInline))
    return
  }

  if (typeof value !== 'object') return

  const node = value as Record<string, unknown>

  if (node.type === 'inlineBlock' && node.fields && typeof node.fields === 'object') {
    const f = node.fields as InlineBlockFields
    if (f.blockType === 'chapterCitation' && typeof f.refKey === 'string') {
      const refKey = f.refKey.trim()
      const blockId = typeof f.id === 'string' ? f.id : null
      if (refKey && blockId) {
        onInline(blockId, refKey)
      }
    }
  /* do not recurse into inlineBlock fields as flat object walk would duplicate; children are not inside fields typically */
  }

  Object.entries(node).forEach(([k, childValue]) => {
    if (k === 'fields' && node.type === 'inlineBlock') return
    walk(childValue, onInline)
  })
}

export const extractChapterReferences = (
  state: DefaultTypedEditorState | null | undefined,
  options?: { registry?: CitationRegistryEntry[] | null },
): ChapterReferencesExtraction => {
  const citationMap: Record<string, number> = {}
  const citationLinkLabels: Record<string, string> = {}
  const citationHrefs: Record<string, string> = {}
  const references: ChapterReference[] = []
  const keyToRefNumber = new Map<string, number>()
  const lookup = buildRegistryLookup(options?.registry)

  const instances: Array<{ blockId: string; refKey: string }> = []

  walk(state ?? null, (blockId, refKey) => {
    instances.push({ blockId, refKey })
  })

  for (const { blockId, refKey } of instances) {
    const entry = lookup.get(refKey)
    if (!entry) continue

    let refNumber = keyToRefNumber.get(refKey)
    if (refNumber === undefined) {
      refNumber = references.length + 1
      keyToRefNumber.set(refKey, refNumber)
      const href = (entry.url ?? '').trim()
      const bib = (entry.bibliography ?? '').trim()
      references.push({
        id: refNumber,
        href,
        label: bib || href,
        bibliographyLine: bib || null,
      })
    }

    citationMap[blockId] = refNumber

    const ref = references.find((r) => r.id === refNumber)
    if (ref) {
      const text = getChapterReferenceDisplay(ref)
      citationLinkLabels[blockId] = text
      citationHrefs[blockId] = (ref.href ?? '').trim()
    }
  }

  return { references, citationMap, citationLinkLabels, citationHrefs }
}

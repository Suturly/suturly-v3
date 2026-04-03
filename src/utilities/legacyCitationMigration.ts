import type { SerializedAutoLinkNode, SerializedLinkNode } from '@payloadcms/richtext-lexical'

import { normalizeChapterRefHref } from '@/utilities/chapterReferences'

export type CitationRegistryRow = {
  key: string
  bibliography: string
  url?: string | null
}

export type MigrateDoc = {
  citations?: CitationRegistryRow[] | null
  [key: string]: unknown
}

const getNodeText = (value: unknown): string => {
  if (!value) return ''
  if (Array.isArray(value)) return value.map((item) => getNodeText(item)).join('')
  if (typeof value === 'object') {
    const node = value as { children?: unknown; text?: unknown }
    if (typeof node.text === 'string') return node.text
    return getNodeText(node.children)
  }
  return ''
}

const getBibliographyLine = (linkNode: SerializedLinkNode | SerializedAutoLinkNode): string | null => {
  const raw = (linkNode.fields as { bibliographyLine?: unknown }).bibliographyLine
  if (typeof raw !== 'string') return null
  const t = raw.trim()
  return t.length > 0 ? t : null
}

const getInternalHref = (linkNode: SerializedLinkNode): string | null => {
  const relation = linkNode.fields?.doc?.relationTo
  const value = linkNode.fields?.doc?.value

  if (!relation || typeof value !== 'object' || !value || !('slug' in value)) return null

  const slug = (value as { slug?: unknown }).slug
  if (typeof slug !== 'string' || !slug) return null

  return relation === 'posts' ? `/resources/${slug}` : `/${slug}`
}

const getHrefFromLink = (linkNode: SerializedLinkNode): string | null => {
  const linkType = linkNode.fields?.linkType

  if (linkType === 'internal') return getInternalHref(linkNode)

  const url = linkNode.fields?.url
  return typeof url === 'string' && url.trim().length > 0 ? url : null
}

const getHrefFromAutolink = (node: SerializedAutoLinkNode): string | null => {
  const url = node.fields?.url
  return typeof url === 'string' && url.trim().length > 0 ? url : null
}

function newLexicalId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '')
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 11)}`
}

function newCitationKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return newLexicalId()
}

function isLegacyLinkish(node: unknown): node is Record<string, unknown> & { type: string } {
  return (
    typeof node === 'object' &&
    node !== null &&
    'type' in node &&
    ((node as { type: unknown }).type === 'link' || (node as { type: unknown }).type === 'autolink')
  )
}

function legacyLinkToInlineBlock(node: SerializedLinkNode | SerializedAutoLinkNode, kind: 'link' | 'autolink') {
  const href =
    kind === 'link' ? getHrefFromLink(node as SerializedLinkNode) : getHrefFromAutolink(node as SerializedAutoLinkNode)

  if (!href?.trim()) return null

  const normalized = normalizeChapterRefHref(href)
  const rawLabel = getNodeText((node as { children?: unknown }).children)
    .replace(/\s+/g, ' ')
    .trim()
  const bibFromField = getBibliographyLine(node)
  const bibliography = (bibFromField || rawLabel || href).trim()

  return {
    normalizedHref: normalized,
    displayHref: href.trim(),
    bibliography,
  }
}

/**
 * One-time style migration: Lexical `link` / `autolink` nodes (with href) become `chapterCitation` inline
 * blocks; `data.citations` gains rows keyed by normalized URL (reusing existing rows when URL matches).
 */
export function migrateLegacyLinkCitationsToInline(data: MigrateDoc): void {
  const existingRows: CitationRegistryRow[] = Array.isArray(data.citations) ? [...data.citations] : []
  const urlToKey = new Map<string, string>()

  for (const row of existingRows) {
    const key = typeof row.key === 'string' ? row.key.trim() : ''
    const u = typeof row.url === 'string' ? row.url.trim() : ''
    if (key && u) {
      urlToKey.set(normalizeChapterRefHref(u), key)
    }
  }

  const pendingRows: CitationRegistryRow[] = []

  const ensureKey = (normalizedHref: string, bibliography: string, displayHref: string): string => {
    let key = urlToKey.get(normalizedHref)
    if (key) return key
    key = newCitationKey()
    urlToKey.set(normalizedHref, key)
    pendingRows.push({
      key,
      bibliography,
      url: displayHref,
    })
    return key
  }

  const replaceInArray = (arr: unknown[]): void => {
    for (let i = 0; i < arr.length; i++) {
      const item = arr[i]

      if (isLegacyLinkish(item)) {
        const n = item as unknown as SerializedLinkNode
        const kind = n.type as 'link' | 'autolink'
        const parsed = legacyLinkToInlineBlock(n, kind)
        if (parsed) {
          const refKey = ensureKey(parsed.normalizedHref, parsed.bibliography, parsed.displayHref)
          arr[i] = {
            type: 'inlineBlock',
            version: 1,
            fields: {
              blockType: 'chapterCitation',
              id: newLexicalId(),
              refKey,
            },
          }
          continue
        }
      }

      mutateDeep(item)
    }
  }

  function mutateDeep(value: unknown): void {
    if (value === null || value === undefined) return
    if (Array.isArray(value)) {
      replaceInArray(value)
      return
    }
    if (typeof value !== 'object') return
    for (const v of Object.values(value as Record<string, unknown>)) {
      mutateDeep(v)
    }
  }

  mutateDeep(data)

  if (pendingRows.length > 0) {
    const existingKeys = new Set(existingRows.map((r) => (typeof r.key === 'string' ? r.key.trim() : '')))
    for (const row of pendingRows) {
      if (!existingKeys.has(row.key)) {
        existingRows.push(row)
        existingKeys.add(row.key)
      }
    }
    data.citations = existingRows
  }
}

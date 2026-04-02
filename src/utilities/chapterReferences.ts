import type {
  DefaultTypedEditorState,
  SerializedAutoLinkNode,
  SerializedLinkNode,
} from '@payloadcms/richtext-lexical'

export const CHAPTER_REF_OPEN_EVENT = 'suturly:chapter-ref-open'

export type ChapterRefOpenDetail = { id: number }

export type ChapterReference = {
  href: string
  id: number
  label: string
  bibliographyLine?: string | null
}

/** Citation hover hint and chapter references list use the same string. */
export function getChapterReferenceDisplay(ref: ChapterReference): string {
  return ref.bibliographyLine?.trim() || ref.label?.trim() || ref.href
}

export type ChapterReferencesExtraction = {
  references: ChapterReference[]
  citationMap: Record<string, number>
  citationLinkLabels: Record<string, string>
}

const getBibliographyLine = (linkNode: SerializedLinkNode | SerializedAutoLinkNode): string | null => {
  const raw = (linkNode.fields as { bibliographyLine?: unknown }).bibliographyLine
  if (typeof raw !== 'string') return null
  const t = raw.trim()
  return t.length > 0 ? t : null
}

const getNodeText = (value: unknown): string => {
  if (!value) return ''

  if (Array.isArray(value)) {
    return value.map((item) => getNodeText(item)).join('')
  }

  if (typeof value === 'object') {
    const node = value as { children?: unknown; text?: unknown }

    if (typeof node.text === 'string') {
      return node.text
    }

    return getNodeText(node.children)
  }

  return ''
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

type LinkKind = 'link' | 'autolink'

const walk = (
  value: unknown,
  onLink: (linkNode: SerializedLinkNode | SerializedAutoLinkNode, kind: LinkKind) => void,
): void => {
  if (!value) return

  if (Array.isArray(value)) {
    value.forEach((item) => walk(item, onLink))
    return
  }

  if (typeof value !== 'object') return

  const node = value as Record<string, unknown>

  if (node.type === 'link') {
    onLink(node as unknown as SerializedLinkNode, 'link')
  } else if (node.type === 'autolink') {
    onLink(node as unknown as SerializedAutoLinkNode, 'autolink')
  }

  Object.values(node).forEach((childValue) => walk(childValue, onLink))
}

const getLexicalNodeId = (node: SerializedLinkNode | SerializedAutoLinkNode): string | null => {
  const id = (node as unknown as { id?: unknown }).id
  return typeof id === 'string' ? id : null
}

export const extractChapterReferences = (
  state: DefaultTypedEditorState | null | undefined,
): ChapterReferencesExtraction => {
  const citationMap: Record<string, number> = {}
  const citationLinkLabels: Record<string, string> = {}
  const references: ChapterReference[] = []
  const hrefToId = new Map<string, number>()
  let fallbackCount = 0

  walk(state, (linkNode, kind) => {
    const href =
      kind === 'link'
        ? getHrefFromLink(linkNode as SerializedLinkNode)
        : getHrefFromAutolink(linkNode as SerializedAutoLinkNode)

    if (!href) return

    const normalized = normalizeChapterRefHref(href)
    const rawLabel = getNodeText(linkNode.children).replace(/\s+/g, ' ').trim()
    const label = rawLabel || href
    const bib = getBibliographyLine(linkNode)

    const nodeId = getLexicalNodeId(linkNode)
    const nodeKey = nodeId || `fallback-${fallbackCount++}`

    let refId = hrefToId.get(normalized)
    if (refId === undefined) {
      refId = references.length + 1
      hrefToId.set(normalized, refId)
      references.push({
        id: refId,
        href,
        label,
        bibliographyLine: bib,
      })
    } else {
      const existing = references.find((r) => r.id === refId)
      if (existing) {
        if (bib && !existing.bibliographyLine) {
          existing.bibliographyLine = bib
        }
        const incomingLabel = rawLabel.trim()
        if (
          incomingLabel &&
          incomingLabel !== href &&
          (!existing.label?.trim() || existing.label === existing.href)
        ) {
          existing.label = incomingLabel
        }
      }
    }

    citationMap[nodeKey] = refId
  })

  for (const ref of references) {
    const text = getChapterReferenceDisplay(ref)
    for (const [key, id] of Object.entries(citationMap)) {
      if (id === ref.id) {
        citationLinkLabels[key] = text
      }
    }
  }

  return { references, citationMap, citationLinkLabels }
}

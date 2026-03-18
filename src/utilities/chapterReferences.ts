import type { DefaultTypedEditorState, SerializedLinkNode } from '@payloadcms/richtext-lexical'

export type ChapterReference = {
  href: string
  id: number
  label: string
  nodeKey: string
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

const walk = (value: unknown, onLink: (linkNode: SerializedLinkNode) => void): void => {
  if (!value) return

  if (Array.isArray(value)) {
    value.forEach((item) => walk(item, onLink))
    return
  }

  if (typeof value !== 'object') return

  const node = value as Record<string, unknown>

  if (node.type === 'link') {
    onLink(node as unknown as SerializedLinkNode)
  }

  Object.values(node).forEach((childValue) => walk(childValue, onLink))
}

export const extractChapterReferences = (
  state: DefaultTypedEditorState | null | undefined,
): ChapterReference[] => {
  const references: ChapterReference[] = []
  let fallbackCount = 0

  walk(state, (linkNode) => {
    const href = getHrefFromLink(linkNode)
    if (!href) return

    const rawLabel = getNodeText(linkNode.children).replace(/\s+/g, ' ').trim()
    const label = rawLabel || href
    const id = references.length + 1
    const nodeId =
      typeof (linkNode as unknown as { id?: unknown }).id === 'string'
        ? ((linkNode as unknown as { id: string }).id as string)
        : null
    const nodeKey = nodeId || `fallback-${fallbackCount++}`

    references.push({ id, href, label, nodeKey })
  })

  return references
}

export const buildChapterCitationMap = (references: ChapterReference[]): Record<string, number> => {
  return references.reduce<Record<string, number>>((acc, reference) => {
    acc[reference.nodeKey] = reference.id
    return acc
  }, {})
}

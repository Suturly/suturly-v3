import type { SerializedLexicalNode } from 'lexical'

export function getParentChildArray(parent: unknown): unknown[] | null {
  if (!parent || typeof parent !== 'object' || !('children' in parent)) return null
  const ch = (parent as { children: unknown }).children
  return Array.isArray(ch) ? ch : null
}

export function isChapterCitationInlineBlock(node: unknown): boolean {
  if (!node || typeof node !== 'object') return false
  const n = node as { type?: string; fields?: { blockType?: string } }
  return n.type === 'inlineBlock' && n.fields?.blockType === 'chapterCitation'
}

/** Trailing ASCII space/tab only — line breaks and NBSP are left as-is. */
export function trimTrailingCollapsibleAsciiSpaceBeforeCite(text: string): string {
  return text.replace(/[ \t]+$/, '')
}

/** Immutable: strip trailing space/tab on the last text leaf (DFS) under these nodes. */
export function trimLastTextLeafForCitationSpacing(
  nodes: SerializedLexicalNode[],
): SerializedLexicalNode[] {
  if (!nodes.length) return nodes
  const lastIdx = nodes.length - 1
  const last = nodes[lastIdx] as SerializedLexicalNode & {
    type?: string
    text?: string
    children?: SerializedLexicalNode[]
  }

  if (last.type === 'text' && typeof last.text === 'string') {
    const trimmed = trimTrailingCollapsibleAsciiSpaceBeforeCite(last.text)
    if (trimmed === last.text) return nodes
    return [...nodes.slice(0, lastIdx), { ...last, text: trimmed } as SerializedLexicalNode]
  }

  if (Array.isArray(last.children) && last.children.length > 0) {
    const nextChildren = trimLastTextLeafForCitationSpacing(last.children)
    if (nextChildren !== last.children) {
      return [...nodes.slice(0, lastIdx), { ...last, children: nextChildren } as SerializedLexicalNode]
    }
  }

  return nodes
}

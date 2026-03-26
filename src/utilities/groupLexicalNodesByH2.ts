import type { SerializedLexicalNode } from 'lexical'

export function isLexicalH2HeadingNode(node: SerializedLexicalNode): boolean {
  return (
    node.type === 'heading' &&
    'tag' in node &&
    (node as { tag?: string }).tag === 'h2'
  )
}

/**
 * Split top-level Lexical root children into groups: each group starts at an `h2` heading.
 * Content before the first `h2` is its own group (preface).
 */
export function groupLexicalRootChildrenByH2(nodes: SerializedLexicalNode[]): SerializedLexicalNode[][] {
  if (!nodes.length) return []

  const groups: SerializedLexicalNode[][] = []
  let current: SerializedLexicalNode[] = []

  for (const node of nodes) {
    if (isLexicalH2HeadingNode(node)) {
      if (current.length > 0) {
        groups.push(current)
      }
      current = [node]
    } else {
      current.push(node)
    }
  }

  if (current.length > 0) {
    groups.push(current)
  }

  return groups
}

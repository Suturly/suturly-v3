type LexicalNode = {
  type?: string
  tag?: string
  text?: string
  children?: LexicalNode[]
}

const normalize = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

const collectText = (nodes: LexicalNode[] = []): string =>
  nodes
    .map((node) => {
      if (typeof node?.text === 'string') return node.text
      if (Array.isArray(node?.children)) return collectText(node.children)
      return ''
    })
    .join('')
    .trim()

const walkForH2 = (nodes: LexicalNode[] = [], result: string[] = []): string[] => {
  for (const node of nodes) {
    if (node?.type === 'heading' && node?.tag === 'h2') {
      const text = collectText(node.children)
      if (text) result.push(text)
    }
    if (Array.isArray(node?.children)) {
      walkForH2(node.children, result)
    }
  }
  return result
}

export const extractH2Headings = (editorState: unknown): string[] => {
  const root = (editorState as { root?: { children?: LexicalNode[] } })?.root
  if (!root || !Array.isArray(root.children)) return []
  return walkForH2(root.children)
}

export const buildHeadingAnchors = (headings: string[], prefix: string) => {
  const seen: Record<string, number> = {}

  return headings.map((text) => {
    const base = normalize(text) || 'section'
    const count = seen[base] ?? 0
    seen[base] = count + 1
    const suffix = count > 0 ? `-${count + 1}` : ''
    return {
      text,
      id: `${prefix}-${base}${suffix}`,
    }
  })
}

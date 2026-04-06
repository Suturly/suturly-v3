/**
 * Legacy `procedureTypeCard.shortDescription` values were stored as plain strings.
 * Lexical richText requires a serialized editor state object. Convert strings in-place
 * so admin and API always see valid Lexical JSON.
 */

type LexicalRoot = {
  type: string
  children?: unknown[]
  [key: string]: unknown
}

type LexicalSerializedState = {
  root: LexicalRoot
}

function isLexicalSerializedState(value: unknown): value is LexicalSerializedState {
  if (!value || typeof value !== 'object' || !('root' in value)) return false
  const root = (value as LexicalSerializedState).root
  return typeof root === 'object' && root !== null && (root as LexicalRoot).type === 'root'
}

/** Minimal Lexical document: one paragraph with the given plain text (or empty paragraph). */
export function plainStringToMinimalLexicalState(text: string): LexicalSerializedState {
  const trimmed = typeof text === 'string' ? text : ''
  const paragraphChildren =
    trimmed.length > 0
      ? [
          {
            type: 'text',
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: trimmed,
            version: 1,
          },
        ]
      : []

  return {
    root: {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: paragraphChildren,
          direction: 'ltr',
          format: '',
          indent: 0,
          version: 1,
        },
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  }
}

function walkLexicalNode(node: unknown, replaced: { count: number }): void {
  if (!node || typeof node !== 'object') return
  const n = node as Record<string, unknown>

  if (n.type === 'block' && n.fields && typeof n.fields === 'object') {
    const fields = n.fields as Record<string, unknown>
    if (
      fields.blockType === 'procedureTypeCard' &&
      typeof fields.shortDescription === 'string'
    ) {
      fields.shortDescription = plainStringToMinimalLexicalState(fields.shortDescription)
      replaced.count += 1
    }
    for (const value of Object.values(fields)) {
      if (isLexicalSerializedState(value)) {
        walkLexicalSerializedState(value, replaced)
      }
    }
  }

  if (Array.isArray(n.children)) {
    for (const child of n.children) {
      walkLexicalNode(child, replaced)
    }
  }
}

function walkLexicalSerializedState(state: LexicalSerializedState, replaced: { count: number }): void {
  walkLexicalNode(state.root, replaced)
}

function migrateOneLexicalField(value: unknown, replaced: { count: number }): void {
  if (!isLexicalSerializedState(value)) return
  walkLexicalSerializedState(value, replaced)
}

/**
 * Mutates Lexical trees in place when nested procedure cards have string `shortDescription`.
 * Resources (posts) store the main body under `categorySections[].content`; optional `content`
 * is still scanned for older layouts.
 */
export function migrateLegacyProcedureShortDescriptionStrings(doc: unknown): number {
  if (!doc || typeof doc !== 'object') return 0
  const d = doc as {
    content?: unknown
    categorySections?: Array<{ content?: unknown }> | null
  }
  const replaced = { count: 0 }
  migrateOneLexicalField(d.content, replaced)
  const sections = d.categorySections
  if (Array.isArray(sections)) {
    for (const section of sections) {
      if (!section || typeof section !== 'object') continue
      migrateOneLexicalField((section as { content?: unknown }).content, replaced)
    }
  }
  return replaced.count
}

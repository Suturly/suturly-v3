'use client'

import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useDocumentForm, useFormFields } from '@payloadcms/ui'
import { useCallback, useEffect, useState } from 'react'

import { extractChapterReferences, type CitationRegistryEntry } from '@/utilities/chapterReferences'

/**
 * In-editor pill: [1], [2], … same ordering as public site (extractChapterReferences).
 */
export function ChapterCitationInlineLabel() {
  const [editor] = useLexicalComposerContext()
  const { getData } = useDocumentForm()
  const blockId = useFormFields(([fields]) => String(fields?.id?.value ?? ''))
  const refKey = useFormFields(([fields]) => String(fields?.refKey?.value ?? ''))

  const citationsFingerprint = useFormFields(([fields]) => {
    if (!fields) return ''
    let s = ''
    let i = 0
    while (fields[`citations.${i}.id`]) {
      s += `${String(fields[`citations.${i}.key`]?.value ?? '')}|${String(fields[`citations.${i}.bibliography`]?.value ?? '')};`
      i += 1
      if (i > 200) break
    }
    return s
  })

  const [num, setNum] = useState<number | null>(null)

  const recompute = useCallback(() => {
    const doc = getData() as { citations?: CitationRegistryEntry[] | null } | undefined
    const registry = Array.isArray(doc?.citations) ? doc.citations : []
    try {
      const state = editor.getEditorState().toJSON() as unknown as DefaultTypedEditorState
      const { citationMap } = extractChapterReferences(state, { registry })
      if (blockId && citationMap[blockId] != null) {
        setNum(citationMap[blockId])
        return
      }
    } catch {
      /* ignore */
    }
    setNum(null)
  }, [editor, getData, blockId])

  useEffect(() => {
    recompute()
    return editor.registerUpdateListener(() => {
      recompute()
    })
  }, [editor, recompute])

  useEffect(() => {
    recompute()
  }, [citationsFingerprint, refKey, recompute])

  if (!blockId && !refKey.trim()) {
    return <span className="chapter-citation-inline-label">…</span>
  }

  const display = num != null ? String(num) : '?'

  return <span className="chapter-citation-inline-label">[{display}]</span>
}

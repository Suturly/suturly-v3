'use client'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $isHeadingNode } from '@lexical/rich-text'
import { TextNode } from 'lexical'
import { useEffect } from 'react'

export function StripHeadingFormatsPlugin() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerNodeTransform(TextNode, (node) => {
      const parent = node.getParent()
      if (!$isHeadingNode(parent)) return
      if (node.hasFormat('bold')) node.toggleFormat('bold')
      if (node.hasFormat('italic')) node.toggleFormat('italic')
    })
  }, [editor])

  return null
}

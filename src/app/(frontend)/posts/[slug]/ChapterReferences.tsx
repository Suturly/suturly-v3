'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/utilities/ui'
import type { ChapterReference } from '@/utilities/chapterReferences'
import React, { useEffect, useMemo, useState } from 'react'

type Props = {
  references: ChapterReference[]
}

const INITIAL_VISIBLE_COUNT = 5

export const ChapterReferences: React.FC<Props> = ({ references }) => {
  const [expanded, setExpanded] = useState(false)
  const [resolvedTitles, setResolvedTitles] = useState<Record<string, string>>({})

  const hiddenCount = Math.max(0, references.length - INITIAL_VISIBLE_COUNT)
  const visibleReferences = useMemo(
    () => (expanded ? references : references.slice(0, INITIAL_VISIBLE_COUNT)),
    [expanded, references],
  )

  useEffect(() => {
    const hrefs = Array.from(new Set(references.map((reference) => reference.href)))
    if (hrefs.length === 0) return

    const controller = new AbortController()

    const loadTitles = async () => {
      try {
        const response = await fetch('/api/reference-titles', {
          body: JSON.stringify({ hrefs }),
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
          signal: controller.signal,
        })

        if (!response.ok) return
        const data = (await response.json()) as { titles?: Record<string, string> }
        if (data.titles) setResolvedTitles(data.titles)
      } catch {
        // Keep URL fallback labels if request fails.
      }
    }

    void loadTitles()

    return () => controller.abort()
  }, [references])

  return (
    <section className="resource-chapter-references">
      <h2 className="resource-chapter-references__title">Chapter references</h2>

      {references.length > 0 ? (
        <ol className={cn('resource-chapter-references__list', !expanded && hiddenCount > 0 && 'is-truncated')}>
          {visibleReferences.map((reference) => (
            <li className="resource-chapter-references__item" key={reference.nodeKey}>
              <span className="resource-chapter-references__citation">{reference.id}</span>
              <a
                className="resource-chapter-references__link"
                href={reference.href}
                rel={reference.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                target={reference.href.startsWith('http') ? '_blank' : undefined}
              >
                {resolvedTitles[reference.href] || reference.href}
              </a>
            </li>
          ))}
        </ol>
      ) : (
        <p className="resource-chapter-references__empty">No references in this chapter yet.</p>
      )}

      {!expanded && hiddenCount > 0 ? (
        <Button
          className="resource-chapter-references__toggle"
          onClick={() => setExpanded(true)}
          size="big"
          type="button"
          variant="outline"
        >
          Show all {references.length}
        </Button>
      ) : null}
    </section>
  )
}

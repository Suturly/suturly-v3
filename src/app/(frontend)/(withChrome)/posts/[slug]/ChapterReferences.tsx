'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/utilities/ui'
import {
  CHAPTER_REF_OPEN_EVENT,
  type ChapterRefOpenDetail,
  type ChapterReference,
} from '@/utilities/chapterReferences'
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

type Props = {
  references: ChapterReference[]
}

const INITIAL_VISIBLE_COUNT = 5

const SCROLL_RETRY_MS = 32
const SCROLL_MAX_ATTEMPTS = 48

export const ChapterReferences: React.FC<Props> = ({ references }) => {
  const [expanded, setExpanded] = useState(false)
  const [scrollToId, setScrollToId] = useState<number | null>(null)
  const scrollRunIdRef = useRef(0)

  const hiddenCount = Math.max(0, references.length - INITIAL_VISIBLE_COUNT)
  const visibleReferences = useMemo(
    () => (expanded ? references : references.slice(0, INITIAL_VISIBLE_COUNT)),
    [expanded, references],
  )

  useEffect(() => {
    const onOpen = (event: Event) => {
      const detail = (event as CustomEvent<ChapterRefOpenDetail>).detail
      if (typeof detail?.id !== 'number') return
      setExpanded(true)
      setScrollToId(detail.id)
    }
    window.addEventListener(CHAPTER_REF_OPEN_EVENT, onOpen)
    return () => window.removeEventListener(CHAPTER_REF_OPEN_EVENT, onOpen)
  }, [])

  useEffect(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash : ''
    const m = /^#chapter-ref-(\d+)$/.exec(hash)
    if (!m) return
    const id = Number(m[1])
    if (!Number.isFinite(id)) return
    setExpanded(true)
    setScrollToId(id)
  }, [])

  /** After expand, list items beyond the fold mount on next paint — retry until target exists. */
  useLayoutEffect(() => {
    if (scrollToId === null || !expanded) return

    const id = scrollToId
    const runId = ++scrollRunIdRef.current
    let attempts = 0
    let timeoutId: number | null = null
    let cancelled = false

    const finish = () => {
      if (cancelled || scrollRunIdRef.current !== runId) return
      setScrollToId(null)
    }

    const tryScroll = () => {
      if (cancelled || scrollRunIdRef.current !== runId) return

      const target = document.getElementById(`chapter-ref-${id}`)
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        finish()
        return
      }

      attempts += 1
      if (attempts >= SCROLL_MAX_ATTEMPTS) {
        document.getElementById('chapter-references-section')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
        finish()
        return
      }

      timeoutId = window.setTimeout(tryScroll, SCROLL_RETRY_MS)
    }

    window.requestAnimationFrame(tryScroll)

    return () => {
      cancelled = true
      if (timeoutId !== null) window.clearTimeout(timeoutId)
    }
  }, [scrollToId, expanded, visibleReferences.length])

  const handleShowAll = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setExpanded(true)
  }, [])

  if (references.length === 0) return null

  return (
    <section className="resource-chapter-references" id="chapter-references-section">
      <h2 className="resource-chapter-references__title">Chapter references</h2>

      <ol className={cn('resource-chapter-references__list', !expanded && hiddenCount > 0 && 'is-truncated')}>
        {visibleReferences.map((reference) => {
          const display =
            reference.bibliographyLine?.trim() || reference.label?.trim() || reference.href
          const href = reference.href.trim()
          const isExternal = href.startsWith('http')
          return (
            <li className="resource-chapter-references__item" id={`chapter-ref-${reference.id}`} key={reference.id}>
              <span className="resource-chapter-references__citation">{reference.id}</span>
              <div className="resource-chapter-references__body">
                {href ? (
                  <a
                    className="resource-chapter-references__text-link"
                    href={href}
                    rel={isExternal ? 'noopener noreferrer' : undefined}
                    target={isExternal ? '_blank' : undefined}
                  >
                    {display}
                  </a>
                ) : (
                  <span className="resource-chapter-references__text-link resource-chapter-references__text-link--no-href">
                    {display}
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ol>

      {!expanded && hiddenCount > 0 ? (
        <Button
          className="resource-chapter-references__toggle"
          onClick={handleShowAll}
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

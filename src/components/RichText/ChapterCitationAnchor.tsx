'use client'

import { CHAPTER_REF_OPEN_EVENT, type ChapterRefOpenDetail } from '@/utilities/chapterReferences'
import React, { useCallback, useEffect, useRef } from 'react'

type Props = {
  refId: number
  sourceHref: string
  /** Bibliography line when set, else link text, else URL — same string as the references list. */
  linkText?: string
}

export function ChapterCitationAnchor({ refId, sourceHref, linkText }: Props) {
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const clearFocusOnHide = () => {
      if (document.visibilityState !== 'hidden') return
      triggerRef.current?.blur()
    }
    document.addEventListener('visibilitychange', clearFocusOnHide)
    return () => document.removeEventListener('visibilitychange', clearFocusOnHide)
  }, [])

  const openBibliography = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      window.dispatchEvent(
        new CustomEvent<ChapterRefOpenDetail>(CHAPTER_REF_OPEN_EVENT, {
          bubbles: true,
          composed: true,
          detail: { id: refId },
        }),
      )
    },
    [refId],
  )

  const href = sourceHref.trim()
  const tooltipLabel = (linkText?.trim() || href).trim()
  const showTooltip = Boolean(tooltipLabel)

  return (
    <span className="payload-richtext__citation-wrap">
      {/* One NBSP: RichText strips a trailing ASCII space before cite when present, then this ties the mark to the preceding word. */}
      {'\u00A0'}
      <button
        ref={triggerRef}
        aria-label={`Go to reference ${refId} in bibliography`}
        className="payload-richtext__citation-trigger"
        onClick={openBibliography}
        type="button"
      >
        <span className="payload-richtext__citation">{refId}</span>
      </button>
      {showTooltip ? (
        <span className="payload-richtext__citation-tooltip" role="tooltip">
          {href ? (
            <a
              className="payload-richtext__citation-tooltip-link"
              href={href}
              onClick={(e) => e.stopPropagation()}
              rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
              target="_blank"
            >
              {tooltipLabel}
            </a>
          ) : (
            <span className="payload-richtext__citation-tooltip-text">{tooltipLabel}</span>
          )}
        </span>
      ) : null}
    </span>
  )
}

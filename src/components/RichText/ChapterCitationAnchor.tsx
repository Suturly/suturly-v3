'use client'

import { CHAPTER_REF_OPEN_EVENT, type ChapterRefOpenDetail } from '@/utilities/chapterReferences'
import React, { useCallback } from 'react'

type Props = {
  refId: number
  sourceHref: string
  /** Bibliography line when set, else link text, else URL — same string as the references list. */
  linkText?: string
}

export function ChapterCitationAnchor({ refId, sourceHref, linkText }: Props) {
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

  return (
    <span className="payload-richtext__citation-wrap">
      <button
        aria-label={`Go to reference ${refId} in bibliography`}
        className="payload-richtext__citation-trigger"
        onClick={openBibliography}
        type="button"
      >
        <span className="payload-richtext__citation">[{refId}]</span>
      </button>
      {href && tooltipLabel ? (
        <span className="payload-richtext__citation-tooltip" role="tooltip">
          <a
            className="payload-richtext__citation-tooltip-link"
            href={href}
            onClick={(e) => e.stopPropagation()}
            rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
            target="_blank"
          >
            {tooltipLabel}
          </a>
        </span>
      ) : null}
    </span>
  )
}

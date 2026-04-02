'use client'

import React from 'react'

import RichText from '@/components/RichText'
import { cn } from '@/utilities/ui'
import { type DefaultTypedEditorState } from '@payloadcms/richtext-lexical'

type Props = {
  className?: string
  title?: string | null
  description?: DefaultTypedEditorState | null
  citationLinkLabels?: Record<string, string>
  linkCitations?: Record<string, number>
}

export const Dropdown: React.FC<Props> = ({
  className,
  title,
  description,
  citationLinkLabels,
  linkCitations,
}) => {
  const [isOpen, setIsOpen] = React.useState(false)

  if (!title && !description) return null

  return (
    <div className={cn('not-prose resource-block-dropdown', isOpen && 'is-open', className)}>
      <button
        aria-expanded={isOpen}
        className="resource-block-dropdown__summary"
        onClick={() => setIsOpen((prev) => !prev)}
        type="button"
      >
        <span className="resource-block-dropdown__icon">
          <svg fill="none" height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M6 8L10 12L14 8"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
            />
          </svg>
        </span>
        <span>{title || 'Details'}</span>
      </button>
      {description ? (
        <div className="resource-block-dropdown__panel">
          <div className="resource-block-dropdown__panel-inner">
            <RichText
              citationLinkLabels={citationLinkLabels}
              className="resource-block-dropdown__content"
              data={description}
              enableGutter={false}
              enableProse={false}
              linkCitations={linkCitations}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}

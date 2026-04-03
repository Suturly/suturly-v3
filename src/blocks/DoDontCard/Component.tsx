import React from 'react'

import { Media } from '@/components/Media'
import RichText from '@/components/RichText'
import { cn } from '@/utilities/ui'
import { type DefaultTypedEditorState } from '@payloadcms/richtext-lexical'

type Props = {
  className?: string
  type?: 'do' | 'dont' | null
  title?: string | null
  content?: DefaultTypedEditorState | null
  image?: object | string | number | null
  citationHrefs?: Record<string, string>
  citationLinkLabels?: Record<string, string>
  linkCitations?: Record<string, number>
}

const renderCardIcon = (type: 'do' | 'dont') => {
  if (type === 'dont') {
    return (
      <svg fill="none" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M7 7L17 17M17 7L7 17"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    )
  }

  return (
    <svg fill="none" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M5 12L10 17L19 8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  )
}

export const DoDontCard: React.FC<Props> = ({
  className,
  type,
  title,
  content,
  image,
  citationHrefs,
  citationLinkLabels,
  linkCitations,
}) => {
  const normalizedType = type === 'dont' ? 'dont' : 'do'

  return (
    <section className={cn('not-prose resource-block-do-dont', className)}>
      <div className="resource-block-do-dont__row">
        <span
          className={cn(
            'resource-block-do-dont__icon',
            normalizedType === 'do'
              ? 'resource-block-do-dont__icon--do'
              : 'resource-block-do-dont__icon--dont',
          )}
        >
          {renderCardIcon(normalizedType)}
        </span>
        <div className="resource-block-do-dont__content">
          {title ? <p className="resource-block-do-dont__title">{title}</p> : null}
          {content ? (
            <RichText
              citationHrefs={citationHrefs}
              citationLinkLabels={citationLinkLabels}
              className="max-w-none"
              data={content}
              enableGutter={false}
              enableProse={false}
              linkCitations={linkCitations}
            />
          ) : null}
        </div>
      </div>

      {image ? (
        <div className="resource-block-do-dont__media">
          <Media
            imgClassName="resource-block-do-dont__image"
            resource={image as number | string | null}
          />
        </div>
      ) : null}
    </section>
  )
}

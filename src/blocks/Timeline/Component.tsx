import React from 'react'

import RichText from '@/components/RichText'
import { cn } from '@/utilities/ui'
import { type DefaultTypedEditorState } from '@payloadcms/richtext-lexical'

type TimelineItem = {
  timeLabel?: string | null
  content?: DefaultTypedEditorState | null
}

type Props = {
  className?: string
  items?: TimelineItem[] | null
  linkCitations?: Record<string, number>
}

export const Timeline: React.FC<Props> = ({ className, items, linkCitations }) => {
  const rows = Array.isArray(items) ? items : []

  return (
    <div className={cn('not-prose resource-block-timeline', className)}>
      <div className="resource-block-timeline__list">
        {rows.map((row, index) => {
          return (
            <div className="resource-block-timeline__item" key={`${row.timeLabel}-${index}`}>
              <div className="resource-block-timeline__track">
                <span className="resource-block-timeline__dot" />
                {index < rows.length - 1 ? <span className="resource-block-timeline__line" /> : null}
              </div>

              <div className="resource-block-timeline__content">
                {row.timeLabel ? <p className="resource-block-timeline__label">{row.timeLabel}</p> : null}

                {row.content ? (
                  <RichText
                    className="max-w-none timeline-content__wrapper"
                    data={row.content}
                    enableGutter={false}
                    enableProse={false}
                    linkCitations={linkCitations}
                  />
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

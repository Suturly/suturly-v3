'use client'

import { hasText } from '@payloadcms/richtext-lexical/shared'
import React, { useId, useState } from 'react'

import { Media } from '@/components/Media'
import RichText from '@/components/RichText'
import { cn } from '@/utilities/ui'
import type { ProcedureTypeCardBlock as ProcedureTypeCardData } from '@/payload-types'

type Props = {
  className?: string
  citationHrefs?: Record<string, string>
  citationLinkLabels?: Record<string, string>
  linkCitations?: Record<string, number>
} & Partial<
  Pick<
    ProcedureTypeCardData,
    'title' | 'chips' | 'shortDescription' | 'image' | 'additionalContent'
  >
>

const ShowMoreChevron = () => (
  <svg fill="none" height="20" viewBox="0 0 20 20" width="20" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M6 8L10 12L14 8"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
  </svg>
)

const InfoHintIcon = () => (
  <svg aria-hidden className="resource-block-procedure-type__chip-info-svg" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.25" />
    <path
      d="M8 7.2V11M8 5.1h.01"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
    />
  </svg>
)

export const ProcedureTypeCard: React.FC<Props> = ({
  className,
  title,
  chips,
  shortDescription,
  image,
  additionalContent,
  citationHrefs,
  citationLinkLabels,
  linkCitations,
}) => {
  const chipList = Array.isArray(chips) ? chips : []
  const [additionalOpen, setAdditionalOpen] = useState(false)
  const additionalLabelId = useId()
  const additionalPanelId = useId()

  return (
    <section className={cn('not-prose resource-block-procedure-type', className)}>
      <div className="resource-block-procedure-type__top">
        <div className="resource-block-procedure-type__main">
          {title ? <h3 className="resource-block-procedure-type__title">{title}</h3> : null}
          {chipList.length > 0 ? (
            <ul className="resource-block-procedure-type__chips">
              {chipList.map((chip, index) => {
                const hint = chip.hint?.trim() ?? ''
                return (
                  <li
                    key={index}
                    className="resource-block-procedure-type__chip"
                    {...(hint ? { 'data-hint': hint } : {})}
                  >
                    {chip.icon ? (
                      <span className="resource-block-procedure-type__chip-icon-wrap">
                        <Media
                          resource={chip.icon}
                          htmlElement={null}
                          className="resource-block-procedure-type__chip-icon"
                          imgClassName="resource-block-procedure-type__chip-icon-img"
                        />
                      </span>
                    ) : null}
                    <span className="resource-block-procedure-type__chip-label">{chip.label}</span>
                    {hint ? (
                      <button
                        type="button"
                        className="resource-block-procedure-type__chip-info"
                        aria-label={hint}
                      >
                        <InfoHintIcon />
                      </button>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          ) : null}
          {shortDescription && hasText(shortDescription) ? (
            <div className="resource-block-procedure-type__description resource-block-procedure-type__description--richtext">
              <RichText
                citationHrefs={citationHrefs}
                citationLinkLabels={citationLinkLabels}
                className="resource-block-procedure-type__short-description-richtext max-w-none"
                data={shortDescription}
                enableGutter={false}
                enableProse={false}
                linkCitations={linkCitations}
              />
            </div>
          ) : null}
        </div>
        {image ? (
          <div className="resource-block-procedure-type__media">
            <Media
              resource={image}
              htmlElement={null}
              className="resource-block-procedure-type__media-inner"
              imgClassName="resource-block-procedure-type__image"
            />
          </div>
        ) : null}
      </div>
      {additionalContent && hasText(additionalContent) ? (
        <div className="resource-block-procedure-type__bottom">
          <h5 className="resource-block-procedure-type__more-heading" id={additionalLabelId}>
            <button
              aria-controls={additionalPanelId}
              aria-expanded={additionalOpen}
              className={cn('resource-block-procedure-type__more-toggle', additionalOpen && 'is-open')}
              onClick={() => setAdditionalOpen((v) => !v)}
              type="button"
            >
              <span className="resource-block-dropdown__icon" aria-hidden>
                <ShowMoreChevron />
              </span>
              <span className="resource-block-procedure-type__more-toggle-label">
                {additionalOpen ? 'Show less' : 'Show more'}
              </span>
            </button>
          </h5>
          <div
            className={cn('resource-block-procedure-type__more-panel', additionalOpen && 'is-open')}
            id={additionalPanelId}
            role="region"
            aria-labelledby={additionalLabelId}
          >
            <div className="resource-block-procedure-type__more-panel-inner">
              <RichText
                citationHrefs={citationHrefs}
                citationLinkLabels={citationLinkLabels}
                className="resource-block-procedure-type__additional max-w-none"
                data={additionalContent}
                enableGutter={false}
                enableProse={false}
                linkCitations={linkCitations}
              />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

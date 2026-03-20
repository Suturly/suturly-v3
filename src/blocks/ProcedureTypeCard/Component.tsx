import React from 'react'

import { Media } from '@/components/Media'
import RichText from '@/components/RichText'
import { cn } from '@/utilities/ui'
import type { ProcedureTypeCardBlock as ProcedureTypeCardData } from '@/payload-types'

type Props = {
  className?: string
  linkCitations?: Record<string, number>
} & Partial<
  Pick<
    ProcedureTypeCardData,
    'title' | 'chips' | 'shortDescription' | 'image' | 'additionalContent'
  >
>

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
  linkCitations,
}) => {
  const chipList = Array.isArray(chips) ? chips : []

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
          {shortDescription ? (
            <p className="resource-block-procedure-type__description">{shortDescription}</p>
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
      {additionalContent ? (
        <div className="resource-block-procedure-type__bottom">
          <RichText
            className="resource-block-procedure-type__additional max-w-none"
            data={additionalContent}
            enableGutter={false}
            enableProse={false}
            linkCitations={linkCitations}
          />
        </div>
      ) : null}
    </section>
  )
}

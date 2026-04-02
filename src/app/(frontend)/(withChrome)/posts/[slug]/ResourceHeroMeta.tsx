'use client'

import { cn } from '@/utilities/ui'
import React, { useId } from 'react'

function capitalizeMonthName(month: string): string {
  const t = month.trim()
  if (!t) return t
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()
}

function formatResourceCalendarDate(iso: string | null | undefined): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const day = d.getUTCDate()
  const monthRaw = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toLocaleString(
    'en-GB',
    { month: 'long', timeZone: 'UTC' },
  )
  const monthName = capitalizeMonthName(monthRaw)
  const year = d.getUTCFullYear()
  return `${day} ${monthName} ${year}`
}

type Props = {
  categoryLabel: string
  className?: string
  publishedAt?: string | null
  lastUpdatedOn?: string | null
}

function HistoryIcon({ clipPathId }: { clipPathId: string }) {
  return (
    <svg
      aria-hidden
      className="resource-main-hero__history-icon"
      fill="none"
      height="16"
      viewBox="0 0 16 16"
      width="16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g clipPath={`url(#${clipPathId})`}>
        <path
          d="M15.1333 7.66667L13.8004 9L12.4666 7.66667M13.9634 8.66667C13.9876 8.44778 14 8.22534 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14C9.88484 14 11.5667 13.1309 12.6667 11.7716M8 4.66667V8L10 9.33333"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.33333"
        />
      </g>
      <defs>
        <clipPath id={clipPathId}>
          <rect fill="white" height="16" width="16" />
        </clipPath>
      </defs>
    </svg>
  )
}

export const ResourceHeroMeta: React.FC<Props> = ({
  categoryLabel,
  className,
  publishedAt,
  lastUpdatedOn,
}) => {
  const reactId = useId()
  const clipPathId = `resource-hero-history-${reactId.replace(/:/g, '')}`

  const publishedDisplay = formatResourceCalendarDate(publishedAt)
  const lastUpdatedDisplay = formatResourceCalendarDate(lastUpdatedOn)

  const showLastUpdatedRow = Boolean(lastUpdatedOn && lastUpdatedDisplay)
  const primaryDateLabel = showLastUpdatedRow ? lastUpdatedDisplay : publishedDisplay

  if (!primaryDateLabel) {
    return (
      <p className={cn('resource-main-hero__chapter', className)}>{categoryLabel}</p>
    )
  }

  const tooltipText = showLastUpdatedRow
    ? `Publish date: ${publishedDisplay ?? '—'}\nLatest update: ${lastUpdatedDisplay ?? '—'}`
    : ''

  return (
    <div className={cn('resource-main-hero__meta', className)}>
      <span className="resource-main-hero__chapter">{categoryLabel}</span>
      <span aria-hidden className="resource-main-hero__meta-sep">
        ·
      </span>
      {showLastUpdatedRow ? (
        <span className="resource-main-hero__date-hint-wrap" tabIndex={0}>
          <span className="resource-main-hero__date-pill">
            <HistoryIcon clipPathId={clipPathId} />
            <span className="resource-main-hero__published text-caption-p">{primaryDateLabel}</span>
          </span>
          <span className="resource-main-hero__date-tooltip" role="tooltip">
            {tooltipText.split('\n').map((line, i) => (
              <React.Fragment key={i}>
                {i > 0 ? <br /> : null}
                {line}
              </React.Fragment>
            ))}
          </span>
        </span>
      ) : (
        <span className="resource-main-hero__published text-caption-p">{primaryDateLabel}</span>
      )}
    </div>
  )
}

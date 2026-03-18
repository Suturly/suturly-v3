import React from 'react'

import { cn } from '@/utilities/ui'

type Props = {
  className?: string
  title?: string | null
  description?: string | null
}

export const InfoBox: React.FC<Props> = ({ className, title, description }) => {
  if (!title && !description) return null

  return (
    <section
      className={cn(
        'not-prose rounded-[0.75rem] border border-primary-100 bg-background p-[var(--space-1)]',
        className,
      )}
    >
      <div className="flex items-start gap-[var(--space-0-5)]">
        <span className="mt-[0.125rem] inline-flex h-[1.5rem] w-[1.5rem] shrink-0 items-center justify-center text-primary-600">
          <svg fill="none" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
            <path d="M12 10V16" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
            <circle cx="12" cy="7" fill="currentColor" r="1.2" />
          </svg>
        </span>
        <div className="space-y-[var(--space-0-25)]">
          {title ? <p className="text-p-nav text-gray-900">{title}</p> : null}
          {description ? <p className="text-p-sm text-gray-500">{description}</p> : null}
        </div>
      </div>
    </section>
  )
}

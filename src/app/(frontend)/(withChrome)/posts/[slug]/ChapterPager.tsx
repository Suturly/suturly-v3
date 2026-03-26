import { Button } from '@/components/ui/button'
import Link from 'next/link'
import React from 'react'

type PagerTarget = {
  href: string
  label: string
}

type Props = {
  next?: PagerTarget
  previous?: PagerTarget
}

export const ChapterPager: React.FC<Props> = ({ next, previous }) => {
  if (!previous && !next) return null

  return (
    <nav aria-label="Chapter navigation" className="resource-chapter-pager">
      {previous ? (
        <div className="resource-chapter-pager__container for-previous">
          <p className="resource-chapter-pager__text text-caption-p">Previous:</p>
          <Link href={previous.href} className="resource-chapter-pager__link text-caption-h">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {previous.label}
          </Link>
        </div>
      ) : (
        <span />
      )}

      {next ? (
        <div className="resource-chapter-pager__container for-next">
          <p className="resource-chapter-pager__text text-caption-p">Next:</p>
          <Link href={next.href} className="resource-chapter-pager__link text-caption-h">
            {next.label}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      ) : (
        <span />
      )}


    </nav>
  )
}

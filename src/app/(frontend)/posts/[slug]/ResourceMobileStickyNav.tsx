'use client'

import { cn } from '@/utilities/ui'
import React from 'react'

import { ResourceNavList } from './ResourceNavList'
import type { SectionTab } from './ResourceNav.types'

type ResourceMobileStickyNavProps = {
  sections: SectionTab[]
  activeTab?: string
  onAnchorNavigate?: (tabSlug: string, anchorId: string) => void
}

export const ResourceMobileStickyNav: React.FC<ResourceMobileStickyNavProps> = ({
  sections,
  activeTab,
  onAnchorNavigate,
}) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [activeHeadingId, setActiveHeadingId] = React.useState('')

  const activeSection = React.useMemo(() => {
    const activeSection = sections.find((section) => section.categorySlug === activeTab)
    return activeSection || sections[0]
  }, [activeTab, sections])

  const activeHeadingLabel = React.useMemo(() => {
    if (!activeSection) return 'Overview'
    const activeHeading = activeSection.headingAnchors.find((heading) => heading.id === activeHeadingId)
    if (activeHeading?.text) return activeHeading.text
    return activeSection.headingAnchors[0]?.text || activeSection.name || 'Overview'
  }, [activeHeadingId, activeSection])

  React.useEffect(() => {
    const headingIds = (activeSection?.headingAnchors || []).map((heading) => heading.id)

    if (headingIds.length === 0) {
      setActiveHeadingId('')
      return
    }

    const updateActiveHeading = () => {
      const offsetTop = 120
      let currentId = headingIds[0]

      for (const id of headingIds) {
        const element = document.getElementById(id)
        if (!element) continue

        const top = element.getBoundingClientRect().top
        if (top - offsetTop <= 0) {
          currentId = id
        } else {
          break
        }
      }

      setActiveHeadingId((prev) => (prev === currentId ? prev : currentId))
    }

    updateActiveHeading()

    let ticking = false
    const onScrollOrResize = () => {
      if (ticking) return
      ticking = true
      window.requestAnimationFrame(() => {
        updateActiveHeading()
        ticking = false
      })
    }

    window.addEventListener('scroll', onScrollOrResize, { passive: true })
    window.addEventListener('resize', onScrollOrResize)
    window.addEventListener('hashchange', onScrollOrResize)

    return () => {
      window.removeEventListener('scroll', onScrollOrResize)
      window.removeEventListener('resize', onScrollOrResize)
      window.removeEventListener('hashchange', onScrollOrResize)
    }
  }, [activeSection])

  const handleAnchorNavigate = React.useCallback(
    (tabSlug: string, anchorId: string) => {
      onAnchorNavigate?.(tabSlug, anchorId)
      setIsOpen(false)
    },
    [onAnchorNavigate],
  )

  return (
    <div className={cn('resource-mobile-sticky-nav', isOpen && 'is-open')}>
      <div aria-hidden className="resource-mobile-sticky-nav__gradient" />

      <div className="resource-mobile-sticky-nav__inner">
        <div className="resource-mobile-sticky-nav__card">
          <div className={cn('resource-mobile-sticky-nav__panel-wrap', isOpen && 'is-open')}>
            <div className="resource-mobile-sticky-nav__panel">
                <p className="resource-mobile-sticky-nav__panel-title">Procedure navigation:</p>
              <div className="resource-nav">
                <ResourceNavList
                  activeTab={activeTab}
                  onAnchorNavigate={handleAnchorNavigate}
                  sections={sections}
                />
              </div>
            </div>
          </div>

          <button
            aria-expanded={isOpen}
            className="resource-mobile-sticky-nav__trigger"
            onClick={() => setIsOpen((prev) => !prev)}
            type="button"
          >
            {isOpen ? (
              <span className="resource-mobile-sticky-nav__close-label">Close</span>
            ) : (
              <div className="resource-mobile-sticky-nav__label-wrap">
                <div className="resource-mobile-sticky-nav__label-inner">
                <span className="resource-mobile-sticky-nav__label-caption">Procedure navigation: </span>
                <span className="resource-mobile-sticky-nav__label-caption">{activeSection?.name || 'Resource'}</span>
              </div>
                
                <span className="resource-mobile-sticky-nav__label">{activeHeadingLabel}</span>
              </div>
            )}
            <span className="resource-mobile-sticky-nav__icon" aria-hidden>
              <svg fill="none" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M3 4.5L6 7.5L9 4.5"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

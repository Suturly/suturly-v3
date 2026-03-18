'use client'

import { cn } from '@/utilities/ui'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { SectionTab } from './ResourceNav.types'

type ResourceNavListProps = {
  sections: SectionTab[]
  activeTab?: string
  onAnchorNavigate?: (tabSlug: string, anchorId: string) => void
}

export const ResourceNavList: React.FC<ResourceNavListProps> = ({
  sections,
  activeTab,
  onAnchorNavigate,
}) => {
  const resolvedActiveTab = useMemo(() => activeTab || sections[0]?.categorySlug, [activeTab, sections])
  const [expandedTab, setExpandedTab] = useState<string | null>(resolvedActiveTab || null)
  const [activeHash, setActiveHash] = useState('')
  const [scrollMasks, setScrollMasks] = useState<Record<string, 'bottom' | 'both' | 'none' | 'top'>>({})
  const linksRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    setExpandedTab(resolvedActiveTab || null)
  }, [resolvedActiveTab])

  useEffect(() => {
    const syncHash = () => setActiveHash(window.location.hash.replace('#', ''))
    syncHash()
    window.addEventListener('hashchange', syncHash)
    return () => window.removeEventListener('hashchange', syncHash)
  }, [])

  useEffect(() => {
    const activeSection = sections.find((section) => section.categorySlug === resolvedActiveTab)
    const headingIds = (activeSection?.headingAnchors || []).map((heading) => heading.id)

    if (headingIds.length === 0) {
      setActiveHash('')
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

      setActiveHash((prev) => (prev === currentId ? prev : currentId))
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

    return () => {
      window.removeEventListener('scroll', onScrollOrResize)
      window.removeEventListener('resize', onScrollOrResize)
    }
  }, [sections, resolvedActiveTab])

  const toggleTab = useCallback((tabSlug: string) => {
    setExpandedTab((current) => (current === tabSlug ? null : tabSlug))
  }, [])

  const openAnchor = useCallback(
    (tabSlug: string, anchorId: string) => {
      onAnchorNavigate?.(tabSlug, anchorId)
    },
    [onAnchorNavigate],
  )

  const updateMaskState = useCallback((slug: string) => {
    const element = linksRefs.current[slug]
    if (!element) return

    const hasOverflow = element.scrollHeight > element.clientHeight + 1
    const nextMask: 'bottom' | 'both' | 'none' | 'top' = hasOverflow
      ? element.scrollTop <= 1
        ? 'bottom'
        : element.scrollTop + element.clientHeight >= element.scrollHeight - 1
          ? 'top'
          : 'both'
      : 'none'

    setScrollMasks((prev) => (prev[slug] === nextMask ? prev : { ...prev, [slug]: nextMask }))
  }, [])

  useEffect(() => {
    if (!expandedTab) return
    updateMaskState(expandedTab)
  }, [expandedTab, updateMaskState])

  useEffect(() => {
    const onResize = () => {
      if (!expandedTab) return
      updateMaskState(expandedTab)
    }

    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [expandedTab, updateMaskState])

  return (
    <nav className="resource-nav__list">
      {sections.map((section) => {
        const isOpen = section.categorySlug === expandedTab

        return (
          <div key={section.id} className="resource-nav__section">
            <button
              className={cn('resource-nav__trigger', isOpen && 'is-open')}
              onClick={() => toggleTab(section.categorySlug)}
              type="button"
            >
              <span className="resource-nav__icon">
                <svg
                  className={cn('resource-nav__chevron', isOpen && 'is-open')}
                  fill="none"
                  viewBox="0 0 12 12"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3 4.5L6 7.5L9 4.5"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span>{section.name}</span>
            </button>

            {section.headingAnchors.length > 0 && (
              <div
                className={cn(
                  'resource-nav__links',
                  isOpen && 'is-open',
                  scrollMasks[section.categorySlug] === 'top' && 'has-mask-top',
                  scrollMasks[section.categorySlug] === 'bottom' && 'has-mask-bottom',
                  scrollMasks[section.categorySlug] === 'both' && 'has-mask-both',
                )}
                onScroll={() => updateMaskState(section.categorySlug)}
                ref={(element) => {
                  linksRefs.current[section.categorySlug] = element
                  if (element && isOpen) {
                    window.requestAnimationFrame(() => updateMaskState(section.categorySlug))
                  }
                }}
              >
                {section.headingAnchors.map((heading) => {
                  const isActiveHeading = activeHash === heading.id

                  return (
                    <button
                      className={cn('resource-nav__link', isActiveHeading && 'is-active')}
                      key={heading.id}
                      onClick={() => openAnchor(section.categorySlug, heading.id)}
                      type="button"
                    >
                      {heading.text}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}

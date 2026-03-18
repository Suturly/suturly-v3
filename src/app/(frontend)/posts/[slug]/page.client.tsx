'use client'
import type { Post } from '@/payload-types'
import { buildChapterCitationMap, extractChapterReferences } from '@/utilities/chapterReferences'
import { Button } from '@/components/ui/button'
import { ChapterReferences } from './ChapterReferences'
import { Media } from '@/components/Media'
import RichText from '@/components/RichText'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ResourceMobileStickyNav } from './ResourceMobileStickyNav'
import { ResourceNavFooter } from './ResourceNavFooter'
import { ResourceNavList } from './ResourceNavList'
import type { SectionTab } from './ResourceNav.types'

type LeftTabsNavProps = {
  sections: SectionTab[]
  activeTab?: string
  onAnchorNavigate?: (tabSlug: string, anchorId: string) => void
}

const PageClient: React.FC = () => {
  /* Force the header to be dark mode while we have an image behind it */
  const { setHeaderTheme } = useHeaderTheme()

  useEffect(() => {
    setHeaderTheme('dark')
  }, [setHeaderTheme])
  return <React.Fragment />
}

export const LeftTabsNav = ({ sections, activeTab, onAnchorNavigate }: LeftTabsNavProps) => {
  return (
    <div className="resource-nav">
      <ResourceNavList activeTab={activeTab} onAnchorNavigate={onAnchorNavigate} sections={sections} />
      <ResourceNavFooter />
    </div>
  )
}

export default PageClient

type ResourceTabsMainProps = {
  benefits?: Post['benefits']
  initialActiveTab?: string
  postTitle: string
  resourcePath: string
  sections: SectionTab[]
  coverImage?: Post['coverImage']
}

export const ResourceTabsMain: React.FC<ResourceTabsMainProps> = ({
  benefits,
  initialActiveTab,
  postTitle,
  resourcePath,
  sections,
  coverImage,
}) => {
  const resolvedInitialTab = initialActiveTab || sections[0]?.categorySlug
  const [activeTab, setActiveTab] = useState<string | undefined>(resolvedInitialTab)
  const cancelAnchorScrollRef = useRef<(() => void) | null>(null)
  const activeSection = useMemo(
    () => sections.find((section) => section.categorySlug === activeTab) || sections[0],
    [activeTab, sections],
  )
  const activeSectionIndex = useMemo(
    () => sections.findIndex((section) => section.categorySlug === activeSection?.categorySlug),
    [activeSection?.categorySlug, sections],
  )
  const previousSection = activeSectionIndex > 0 ? sections[activeSectionIndex - 1] : undefined
  const nextSection = activeSectionIndex >= 0 ? sections[activeSectionIndex + 1] : undefined

  const chapterReferences = useMemo(
    () => (activeSection ? extractChapterReferences(activeSection.content) : []),
    [activeSection],
  )
  const chapterCitationMap = useMemo(
    () => buildChapterCitationMap(chapterReferences),
    [chapterReferences],
  )

  const updateUrl = useCallback(
    (tabSlug: string, anchorId?: string) => {
      const nextUrl = `${resourcePath}?tab=${encodeURIComponent(tabSlug)}${anchorId ? `#${anchorId}` : ''}`
      window.history.pushState({}, '', nextUrl)
    },
    [resourcePath],
  )

  const startAnchorScroll = useCallback((anchorId: string) => {
    let cancelled = false
    let timeoutId: number | null = null

    const tryScroll = () => {
      if (cancelled) return

      const target = document.getElementById(anchorId)
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }

      timeoutId = window.setTimeout(tryScroll, 25)
    }

    window.requestAnimationFrame(tryScroll)

    return () => {
      cancelled = true
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [])

  const navigateToTab = useCallback(
    (tabSlug: string, anchorId?: string) => {
      setActiveTab(tabSlug)
      updateUrl(tabSlug, anchorId)
      if (cancelAnchorScrollRef.current) {
        cancelAnchorScrollRef.current()
        cancelAnchorScrollRef.current = null
      }

      if (!anchorId) {
        window.requestAnimationFrame(() => {
          window.scrollTo({ behavior: 'smooth', top: 0 })
        })
        return
      }

      cancelAnchorScrollRef.current = startAnchorScroll(anchorId)
    },
    [startAnchorScroll, updateUrl],
  )

  useEffect(
    () => () => {
      if (cancelAnchorScrollRef.current) {
        cancelAnchorScrollRef.current()
      }
    },
    [],
  )

  useEffect(() => {
    const onPopState = () => {
      const params = new URLSearchParams(window.location.search)
      const tab = params.get('tab') || sections[0]?.categorySlug
      setActiveTab(tab || sections[0]?.categorySlug)
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [sections])

  return (
    <div className="resource-layout">
      <aside className="resource-layout__aside">
        <LeftTabsNav activeTab={activeSection?.categorySlug} onAnchorNavigate={navigateToTab} sections={sections} />
      </aside>

      <main className="resource-layout__main">
        <div className="resource-main-hero">
          <div className="resource-main-hero__inner">
            <div className="resource-main-hero__content">
              <p className="resource-main-hero__chapter">{activeSection?.name || 'Resource'}</p>
              <h1 className="resource-main-hero__title">{postTitle}</h1>
            </div>
            {coverImage && typeof coverImage !== 'string' ? (
              <div className="resource-main-hero__media-wrap">
                <Media imgClassName="resource-main-hero__media-image" resource={coverImage} />
              </div>
            ) : null}
          </div>
        </div>

        <div className="resource-layout__mobile-nav">
          <div className="resource-nav">
            <ResourceNavList
              activeTab={activeSection?.categorySlug}
              onAnchorNavigate={navigateToTab}
              sections={sections}
            />
          </div>
        </div>


        <div className="resource-main-content">
          <div className="resource-main-content__inner">
            {activeSection ? (
              <section className="resource-main-content__section" id={activeSection.id}>
                {activeSectionIndex === 0 && Array.isArray(benefits) && benefits.length > 0 ? (
                  <div className="resource-benefits">
                    {benefits.map((benefit) => (
                      <article className="resource-benefits__item" key={benefit.id}>
                        {benefit.icon && typeof benefit.icon === 'object' ? (
                          <Media
                            className="resource-benefits__icon-wrap"
                            imgClassName="resource-benefits__icon"
                            resource={benefit.icon}
                          />
                        ) : null}
                        <div className="resource-benefits__text">
                          <p className="resource-benefits__title text-caption-p">{benefit.title}</p>
                          <p className="resource-benefits__description">{benefit.description}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : null}

                <RichText
                  anchorHeadings
                  anchorPrefix={activeSection.id}
                  className="resource-category-richtext"
                  data={activeSection.content}
                  enableGutter={false}
                  linkCitations={chapterCitationMap}
                />
                <ChapterReferences references={chapterReferences} />

                {nextSection ? (
                  <section className="resource-next-step-banner">
                    <div className="resource-next-step-banner__icon" aria-hidden>
                      <svg fill="none" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M4.16602 15L9.16602 10L4.16602 5M10.8327 15L15.8327 10L10.8327 5"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.8"
                        />
                      </svg>
                    </div>
                    <div className="resource-next-step-banner__content">
                      {nextSection.nextStepBannerTitle ? (
                        <h5 className="resource-next-step-banner__title">
                          {nextSection.nextStepBannerTitle}
                        </h5>
                      ) : null}
                      {nextSection.nextStepBannerDescription ? (
                        <p className="resource-next-step-banner__description">
                          {nextSection.nextStepBannerDescription}
                        </p>
                      ) : null}
                    </div>
                    <Button
                      className="resource-next-step-banner__action"
                      onClick={() => navigateToTab(nextSection.categorySlug)}
                      size="big"
                      type="button"
                    >
                      {`Next step: ${nextSection.name}`}
                    </Button>
                  </section>
                ) : null}

                <nav aria-label="Chapter navigation" className="resource-chapter-pager">
                {previousSection ? (
  <div className="resource-chapter-pager__container for-previous">
    <p className="resource-chapter-pager__text text-caption-p">Previous:</p>
    <button 
      onClick={() => navigateToTab(previousSection.categorySlug)}
      className="resource-chapter-pager__link text-caption-h"
      type="button"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      {previousSection.name}
    </button>
  </div>
) : (
  <span />
)}


{nextSection ? (
  <div className="resource-chapter-pager__container for-next">
    <p className="resource-chapter-pager__text text-caption-p">Next:</p>
    <button 
      onClick={() => navigateToTab(nextSection.categorySlug)}
      className="resource-chapter-pager__link text-caption-h"
      type="button"
    >
      {nextSection.name}
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  </div>
) : (
  <span />
)}


                </nav>
              </section>
            ) : null}
          </div>
        </div>
      </main>

      <ResourceMobileStickyNav
        activeTab={activeSection?.categorySlug}
        onAnchorNavigate={navigateToTab}
        sections={sections}
      />
    </div>
  )
}

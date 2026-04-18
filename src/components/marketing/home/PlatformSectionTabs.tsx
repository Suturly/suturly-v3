'use client'

import { useIsDesktopLg } from '@/hooks/useIsDesktopLg'
import gsap from 'gsap'
import Image from 'next/image'
import { useEffect, useId, useRef, useState } from 'react'
import type { Swiper as SwiperType } from 'swiper'
import { Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'

export type PlatformTabSolution = {
  title: string
  description: string
  iconSrc: string
  iconAlt?: string
}

export type PlatformTab = {
  id: string
  tabLabel: string
  panelTitle: string
  solutions: PlatformTabSolution[]
  imageSrc: string
  imageAlt: string
  backgroundImageSrc: string
}

const TABS: PlatformTab[] = [
  {
    id: 'patients',
    tabLabel: 'For patients',
    panelTitle: 'Clear guidance when it matters most',
    solutions: [
      {
        title: 'Never Miss a Step',
        description:
          'Stay on track from prep through recovery with timely guidance via text.',
        iconSrc: '/images/home/never-miss-a-step.svg',
      },
      {
        title: 'Understand Your Care',
        description: 'Get clear answers to your questions in plain language you can understand.',
        iconSrc: '/images/home/understand-your-care.svg',
      },
      {
        title: 'Recover with Confidence',
        description: 'Spot warning signs early and get peace of mind during your recovery.',
        iconSrc: '/images/home/recover-with-confidence.svg',
      },
    ],
    imageSrc: '/images/home/for-patients-main.png',
    imageAlt: 'Suturly patient education interface preview',
    backgroundImageSrc: '/images/home/for-patients-bg.png',
  },
  {
    id: 'surgeons',
    tabLabel: 'For surgeons',
    panelTitle: 'Scale your best consultation to every patient',
    solutions: [
      {
        title: 'Protocol Builder',
        description: 'Replace scattered handouts with one structured care pathway.',
        iconSrc: '/images/home/protocol-builder.svg',
      },
      {
        title: 'Outcomes Dashboard',
        description: 'Spot recovery issues before they become readmissions.',
        iconSrc: '/images/home/outcomes-dashboard.svg',
      },
      {
        title: 'Quality Reporting',
        description: 'Meet compliance requirements without the manual work.',
        iconSrc: '/images/home/quality-reporting.svg',
      },
    ],
    imageSrc: '/images/home/for-surgeons-main.png',
    imageAlt: 'Suturly surgeon workflow preview',
    backgroundImageSrc: '/images/home/for-surgeons-bg.png',
  },
  // {
  //   id: 'health-systems',
  //   tabLabel: 'For health systems',
  //   panelTitle: 'Standardize perioperative communication across service lines',
  //   solutions: [
  //     {
  //       title: 'Scale Quality',
  //       description:
  //         'Roll out timed, step-based education across specialties with governance-friendly templates.',
  //       iconSrc: '/images/home/icon-placeholder.svg',
  //     },
  //     {
  //       title: 'Reach Patients Where They Are',
  //       description:
  //         'Use SMS-first delivery to improve activation without adding portal friction.',
  //       iconSrc: '/images/home/icon-placeholder.svg',
  //     },
  //     {
  //       title: 'Reduce Noise',
  //       description:
  //         'Replace generic packets with journeys mapped to each procedure and recovery milestone.',
  //       iconSrc: '/images/home/icon-placeholder.svg',
  //     },
  //   ],
  //   imageSrc: '/images/home/for-health-systems-main.png',
  //   imageAlt: 'Suturly health system platform preview',
  //   backgroundImageSrc: '/images/home/for-health-systems-bg.png',
  // },
]

function PlatformTabPanelBody({
  tab,
  includeBackground = true,
}: {
  tab: PlatformTab
  includeBackground?: boolean
}) {
  return (
    <>
      {includeBackground && tab.backgroundImageSrc ? (
        <div
          className="platform-tab__panel-background"
          aria-hidden
          style={{
            backgroundImage: `url(${JSON.stringify(tab.backgroundImageSrc)})`,
          }}
        />
      ) : null}

      <h3 className="h4 u-color-primary-600 platform-tab__title">{tab.panelTitle}</h3>

      <ul className="platform-tab__solutions">
        {tab.solutions.map((item) => {
          const iconDecorative = !item.iconAlt
          return (
            <li className="platform-tab__solution" key={item.title}>
              <div className="platform-tab__solution-title-wrap">
              <div
                className="platform-tab__solution-icon"
                {...(iconDecorative ? { 'aria-hidden': true } : {})}
              >
                {item.iconSrc ? (
                  <img
                    className="platform-tab__solution-icon-img"
                    src={item.iconSrc}
                    alt={item.iconAlt ?? ''}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <span className="platform-tab__solution-icon-placeholder" />
                )}
              </div>
              <h4 className="p-sm u-color-primary-1000 u-weight-semibold platform-tab__solution-title">{item.title}</h4>
              </div>
              <p className="p-sm u-color-secondary-500 platform-tab__solution-text">{item.description}</p>
            </li>
          )
        })}
      </ul>

      <div className="platform-tab__media">
        <Image
          className="platform-tab__img"
          src={tab.imageSrc}
          alt={tab.imageAlt}
          width={1150}
          height={550}
          sizes="(max-width: 48rem) 100vw, (max-width: 80rem) 90vw, min(1200px, 100vw)"
          style={{ width: '100%', height: 'auto' }}
          loading="eager"
        />
      </div>
    </>
  )
}

export function PlatformSectionTabs() {
  const baseId = useId()
  const [activeIndex, setActiveIndex] = useState(0)
  const isLg = useIsDesktopLg()
  const swiperRef = useRef<SwiperType | null>(null)
  const panelsRef = useRef<HTMLDivElement | null>(null)
  const isAnimatingRef = useRef(false)
  // Set true after a desktop out-animation completes so the matching useEffect
  // runs the in-animation against the freshly rendered active panel.
  const shouldAnimateInRef = useRef(false)

  const handleDesktopSelect = (newIndex: number) => {
    if (newIndex === activeIndex || isAnimatingRef.current) return

    const root = panelsRef.current
    const currentPanel = root?.querySelectorAll<HTMLElement>('.platform-tab__panel')[activeIndex]
    if (!root || !currentPanel) {
      setActiveIndex(newIndex)
      return
    }

    isAnimatingRef.current = true

    const title = currentPanel.querySelector<HTMLElement>('.platform-tab__title')
    const solutions = currentPanel.querySelector<HTMLElement>('.platform-tab__solutions')
    const media = currentPanel.querySelector<HTMLElement>('.platform-tab__media')
    const background = currentPanel.querySelector<HTMLElement>('.platform-tab__panel-background')

    const textTargets = [title, solutions].filter(Boolean) as HTMLElement[]

    const tl = gsap.timeline({
      onComplete: () => {
        shouldAnimateInRef.current = true
        setActiveIndex(newIndex)
      },
    })
    if (textTargets.length) {
      tl.to(textTargets, { y: -16, opacity: 0, duration: 0.3, ease: 'power2.in' }, 0)
    }
    if (media) {
      tl.to(media, { y: 16, opacity: 0, duration: 0.3, ease: 'power2.in' }, 0)
    }
    if (background) {
      tl.to(background, { opacity: 0, duration: 0.3, ease: 'power2.in' }, 0)
    }
  }

  useEffect(() => {
    if (!shouldAnimateInRef.current) return
    shouldAnimateInRef.current = false

    const root = panelsRef.current
    const newPanel = root?.querySelectorAll<HTMLElement>('.platform-tab__panel')[activeIndex]
    if (!newPanel) {
      isAnimatingRef.current = false
      return
    }

    const title = newPanel.querySelector<HTMLElement>('.platform-tab__title')
    const solutions = newPanel.querySelector<HTMLElement>('.platform-tab__solutions')
    const media = newPanel.querySelector<HTMLElement>('.platform-tab__media')
    const background = newPanel.querySelector<HTMLElement>('.platform-tab__panel-background')
    const textTargets = [title, solutions].filter(Boolean) as HTMLElement[]

    if (textTargets.length) {
      gsap.set(textTargets, { y: -16, opacity: 0 })
    }
    if (media) {
      gsap.set(media, { y: 16, opacity: 0 })
    }
    if (background) {
      gsap.set(background, { opacity: 0 })
    }

    const tl = gsap.timeline({
      onComplete: () => {
        isAnimatingRef.current = false
      },
    })
    if (textTargets.length) {
      tl.to(textTargets, { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out' }, 0)
    }
    if (media) {
      tl.to(media, { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out' }, 0)
    }
    if (background) {
      tl.to(background, { opacity: 1, duration: 0.3, ease: 'power2.out' }, 0)
    }
  }, [activeIndex])

  const tabNav = (
    <div className="platform-tab__nav" role="tablist" aria-label="Platform audiences">
      {TABS.map((tab, index) => {
        const selected = index === activeIndex
        const tabId = `${baseId}-tab-${tab.id}`
        const panelId = `${baseId}-panel-${tab.id}`
        return (
          <button
            key={tab.id}
            type="button"
            className={
              selected ? 'platform-tab__tab platform-tab__tab--is-active' : 'platform-tab__tab'
            }
            role="tab"
            id={tabId}
            aria-selected={selected}
            aria-controls={panelId}
            tabIndex={selected ? 0 : -1}
            onClick={() => {
              if (isLg) {
                handleDesktopSelect(index)
              } else {
                setActiveIndex(index)
                swiperRef.current?.slideTo(index)
              }
            }}
          >
            {tab.tabLabel}
          </button>
        )
      })}
    </div>
  )

  const desktopPanels = (
    <div className="platform-tab__panels" ref={panelsRef}>
      {TABS.map((tab, index) => {
        const selected = index === activeIndex
        const tabId = `${baseId}-tab-${tab.id}`
        const panelId = `${baseId}-panel-${tab.id}`
        return (
          <div
            key={tab.id}
            id={panelId}
            className={
              selected ? 'platform-tab__panel platform-tab__panel--is-active' : 'platform-tab__panel'
            }
            role="tabpanel"
            aria-labelledby={tabId}
            hidden={!selected}
          >
            <PlatformTabPanelBody tab={tab} />
          </div>
        )
      })}
    </div>
  )

  const activeTab = TABS[activeIndex] ?? TABS[0]

  const mobileSwiper = (
    <>
      {activeTab?.backgroundImageSrc ? (
        <div
          className="platform-tab__panel-background platform-tab__panel-background--mobile"
          aria-hidden
          style={{
            backgroundImage: `url(${JSON.stringify(activeTab.backgroundImageSrc)})`,
          }}
        />
      ) : null}
      <Swiper
        className="platform-tab__swiper"
        modules={[Pagination]}
        pagination={{ clickable: true, el: '.platform-tab__mobile-pagination' }}
        spaceBetween={24}
        slidesPerView={1}
        breakpoints={{
          768: { slidesPerView: 2, spaceBetween: 24 },
        }}
        onSwiper={(instance) => {
          swiperRef.current = instance
        }}
        onSlideChange={(instance) => {
          setActiveIndex(instance.activeIndex)
        }}
      >
        {TABS.map((tab) => (
          <SwiperSlide key={tab.id} className="platform-tab__swiper-slide">
            <div
              className="platform-tab__panel platform-tab__panel--carousel"
              id={`${baseId}-panel-${tab.id}`}
              role="tabpanel"
              aria-labelledby={`${baseId}-tab-${tab.id}`}
            >
              <PlatformTabPanelBody tab={tab} includeBackground={false} />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </>
  )

  return (
    <>
      <div className="platform-section">
        <div className="platform-tab">
          {tabNav}
          {isLg ? desktopPanels : mobileSwiper}
        </div>
      </div>
      {/* Sibling of .platform-section so pagination sits below its visual box on mobile */}
      <div className="platform-tab__mobile-pagination" aria-hidden />
    </>
  )
}

'use client'

import { useIsDesktopLg } from '@/hooks/useIsDesktopLg'
import Image from 'next/image'
import { useId, useRef, useState } from 'react'
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
        iconSrc: '/images/home/icon-placeholder.svg',
      },
      {
        title: 'Understand Your Care',
        description: 'Get clear answers to your questions in plain language you can understand.',
        iconSrc: '/images/home/icon-placeholder.svg',
      },
      {
        title: 'Recover with Confidence',
        description: 'Spot warning signs early and get peace of mind during your recovery.',
        iconSrc: '/images/home/icon-placeholder.svg',
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
        iconSrc: '/images/home/icon-placeholder.svg',
      },
      {
        title: 'Outcomes Dashboard',
        description: 'Spot recovery issues before they become readmissions.',
        iconSrc: '/images/home/icon-placeholder.svg',
      },
      {
        title: 'Quality Reporting',
        description: 'Meet compliance requirements without the manual work.',
        iconSrc: '/images/home/icon-placeholder.svg',
      },
    ],
    imageSrc: '/images/home/for-surgeons-main.png',
    imageAlt: 'Suturly surgeon workflow preview',
    backgroundImageSrc: '/images/home/for-surgeons-bg.png',
  },
  {
    id: 'health-systems',
    tabLabel: 'For health systems',
    panelTitle: 'Standardize perioperative communication across service lines',
    solutions: [
      {
        title: 'Scale Quality',
        description:
          'Roll out timed, step-based education across specialties with governance-friendly templates.',
        iconSrc: '/images/home/icon-placeholder.svg',
      },
      {
        title: 'Reach Patients Where They Are',
        description:
          'Use SMS-first delivery to improve activation without adding portal friction.',
        iconSrc: '/images/home/icon-placeholder.svg',
      },
      {
        title: 'Reduce Noise',
        description:
          'Replace generic packets with journeys mapped to each procedure and recovery milestone.',
        iconSrc: '/images/home/icon-placeholder.svg',
      },
    ],
    imageSrc: '/images/home/for-health-systems-main.png',
    imageAlt: 'Suturly health system platform preview',
    backgroundImageSrc: '/images/home/for-health-systems-bg.png',
  },
]

function PlatformTabPanelBody({ tab }: { tab: PlatformTab }) {
  return (
    <>
      {tab.backgroundImageSrc ? (
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
              setActiveIndex(index)
              swiperRef.current?.slideTo(index)
            }}
          >
            {tab.tabLabel}
          </button>
        )
      })}
    </div>
  )

  const desktopPanels = (
    <div className="platform-tab__panels">
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

  const mobileSwiper = (
    <Swiper
      className="platform-tab__swiper marketing-swiper--pad-bottom"
      modules={[Pagination]}
      pagination={{ clickable: true }}
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
            <PlatformTabPanelBody tab={tab} />
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  )

  return (
    <div className="platform-tab">
      {tabNav}
      {isLg ? desktopPanels : mobileSwiper}
    </div>
  )
}

'use client'

import gsap from 'gsap'
import Image from 'next/image'
import { useEffect, useId, useRef, useState } from 'react'

const RING_CIRCUMFERENCE = 62.83
const AUTOROTATE_MS = 6000

type Layer = {
  id: string
  label: string
  description: string
  imageSrc: string
  imageAlt: string
}

const LAYERS: Layer[] = [
  {
    id: 'sms',
    label: 'SMS layer',
    description:
      'Text-based nudges and reminders that reach any phone. Patient responses captured. No PHI transmitted.',
    imageSrc: '/images/home/three-layers-1.png',
    imageAlt: 'Patient reading SMS care reminders on a phone',
  },
  {
    id: 'web',
    label: 'Web layer',
    description:
      'Browser-based guides, checklists, and education patients open from text links: no app install required.',
    imageSrc: '/images/home/three-layers-2.png',
    imageAlt: 'Web-based patient education guides',
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    description:
      'Completion rates, PRO scores, and alerts surface for clinical teams in one real-time view.',
    imageSrc: '/images/home/three-layers-3.png',
    imageAlt: 'Clinician dashboard with engagement and outcomes',
  },
]

function LayerFigure({
  layer,
  className,
  sizes,
  priority,
}: {
  layer: Layer
  className?: string
  sizes: string
  priority?: boolean
}) {
  return (
    <figure className={className}>
      <Image
        src={layer.imageSrc}
        alt={layer.imageAlt}
        width={1200}
        height={800}
        sizes={sizes}
        className="marketing-home-layers__img"
        priority={priority}
        loading={priority ? undefined : 'eager'}
      />
    </figure>
  )
}

/** “Three layers. One system.” — accordion: three headers always visible; exactly one panel open (click to switch). */
export function HomeThreeLayersSection() {
  const [openIndex, setOpenIndex] = useState(0)
  const [userInteracted, setUserInteracted] = useState(false)
  const [sectionInView, setSectionInView] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)
  const ringRefs = useRef<Array<SVGCircleElement | null>>([])
  const headingId = useId()
  const idPrefix = useId().replace(/:/g, '')

  const displayLayer = LAYERS[openIndex]
  const autorotateActive = sectionInView && !userInteracted

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        setSectionInView(entry.isIntersecting)
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Drive ring fill: pre-interaction animates the active ring over AUTOROTATE_MS;
  // post-interaction toggles instantly on tab switch. Only while section is in view.
  useEffect(() => {
    const rings = ringRefs.current
    rings.forEach((ring) => ring && gsap.killTweensOf(ring))

    if (userInteracted || !sectionInView) {
      rings.forEach((ring, i) => {
        if (!ring) return
        gsap.set(ring, { strokeDashoffset: i === openIndex ? 0 : RING_CIRCUMFERENCE })
      })
      return
    }

    rings.forEach((ring, i) => {
      if (!ring) return
      if (i === openIndex) {
        gsap.set(ring, { strokeDashoffset: RING_CIRCUMFERENCE })
        gsap.to(ring, {
          strokeDashoffset: 0,
          duration: AUTOROTATE_MS / 1000,
          ease: 'none',
        })
      } else {
        gsap.set(ring, { strokeDashoffset: RING_CIRCUMFERENCE })
      }
    })
  }, [openIndex, userInteracted, sectionInView])

  // Autorotate tabs only while the section is in view and the user has not taken over.
  useEffect(() => {
    if (!autorotateActive) return
    const id = window.setInterval(() => {
      setOpenIndex((i) => (i + 1) % LAYERS.length)
    }, AUTOROTATE_MS)
    return () => window.clearInterval(id)
  }, [autorotateActive])

  const handleTabClick = (i: number) => {
    setUserInteracted(true)
    setOpenIndex(i)
  }

  return (
    <section
      ref={sectionRef}
      className="section section--pad-lg marketing-home-layers"
      aria-labelledby={headingId}
    >
      <div className="container">
        <div className="row marketing-home-layers__row">
          <div className="col col-xs-12 col-lg-6 marketing-home-layers__wrapper">
            <h2 id={headingId} className="h2 u-color-primary-400 marketing-home-layers__title">
              Three layers. <span className="u-color-primary-600">One system.</span>
            </h2>

            <div className="marketing-home-layers__tabs u-d-flex" role="presentation">
              {LAYERS.map((l, i) => {
                const isOpen = openIndex === i
                const panelId = `${idPrefix}-panel-${l.id}`
                const headerId = `${idPrefix}-header-${l.id}`
                return (
                  <div key={l.id} className="marketing-home-layers__tab">
                    <button
                      id={headerId}
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      className="marketing-home-layers__tab-trigger"
                      onClick={() => handleTabClick(i)}
                    >
                      <span className="marketing-home-layers__tab-ring" aria-hidden>
                        <svg
                          className="features-svg-ring marketing-home-layers__ring-svg"
                          viewBox="0 0 24 24"
                          width={24}
                          height={24}
                          aria-hidden
                          focusable="false"
                        >
                          <circle
                            className="steps-ring-sm"
                            cx="12"
                            cy="12"
                            r="4"
                            fill="inherit"
                            
                          />
                          <circle
                            className="steps-ring-bg"
                            cx="12"
                            cy="12"
                            r="10"
                            fill="none"
                            strokeWidth="1"
                          />
                          <circle
                            ref={(el) => {
                              ringRefs.current[i] = el
                            }}
                            className="steps-ring-fill"
                            cx="12"
                            cy="12"
                            r="10"
                            fill="none"
                            strokeWidth="1"
                            strokeLinecap="round"
                            strokeDasharray="62.83 62.83"
                            strokeDashoffset={RING_CIRCUMFERENCE}
                            transform="rotate(-90 12 12)"
                          />
                        </svg>
                      </span>
                      <span className="h6 color-primary-1000 marketing-home-layers__tab-label">{l.label}</span>
                    </button>
                    <div
                      className="marketing-home-layers__tab-panel-outer"
                      data-state={isOpen ? 'open' : 'closed'}
                    >
                      <div className="marketing-home-layers__tab-panel-inner">
                        <div
                          id={panelId}
                          role="region"
                          aria-labelledby={headerId}
                          aria-hidden={!isOpen}
                          className="marketing-home-layers__tab-panel"
                        >
                          <p className="color-primary-1000 u-opacity-60 marketing-home-layers__tab-text">
                            {l.description}
                          </p>
                          <div className="marketing-home-layers__tab-panel-media u-lg-hide">
                            <LayerFigure
                              layer={l}
                              className="marketing-home-layers__figure marketing-home-layers__figure--inline"
                              sizes="100vw"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="marketing-home-layers__tab-rule" aria-hidden />
                  </div>
                )
              })}
            </div>
          </div>

          <div className="col col-xs-12 col-lg-6 u-lg-only">
            <LayerFigure
              layer={displayLayer}
              className="marketing-home-layers__figure marketing-home-layers__figure--desktop"
              sizes="(min-width: 64rem) 50vw, 100vw"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

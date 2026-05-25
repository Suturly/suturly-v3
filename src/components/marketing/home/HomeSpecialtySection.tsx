'use client'

import { PartnerContactOpenButton } from '@/components/marketing/partnerContactModal'
import Image from 'next/image'
import { useEffect, useRef } from 'react'
import { Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

type SpecialtyCard = {
  id: string
  title: string
  body: string
}

const SPECIALTY_CARDS: SpecialtyCard[] = [
  {
    id: 'plastic',
    title: 'Plastic & Reconstructive Surgery',
    body: 'Educate patients on surgical and non-surgical options — covering candidacy, recovery timelines, risks, and what results to realistically expect.',
  },
  {
    id: 'ent',
    title: 'Otolaryngology (ENT)',
    body: 'Help patients understand their condition and prepare for surgery with clear guidance on functional expectations, hearing outcomes, and recovery.',
  },
  {
    id: 'derm',
    title: 'Dermatology',
    body: 'Deliver rehab timelines, pain management guidance, and milestone tracking from surgery day through full recovery.',
  },
  {
    id: 'bariatric',
    title: 'Bariatric Surgery',
    body: 'Walk patients through every stage — from BMI-specific procedure selection and pre-op diets to post-op supplements and lifestyle changes — all aligned with MBSAQIP guidelines',
  },
  {
    id: 'gi',
    title: 'Gastroenterology (GI)',
    body: 'Replace confusing prep packets with timed, step-by-step colonoscopy and endoscopy preparation guides.',
  },
  {
    id: 'ortho',
    title: 'Orthopedic Surgery',
    body: 'Prepare patients for in-office procedures with clear wound care instructions and follow-up reminders.',
  },
]

function SpecialtyCardArticle({ card }: { card: SpecialtyCard }) {
  return (
    <article className="marketing-home-specialty__card">
      <div className="specialty__card-bg" />
      <h3 className="h6 u-color-primary-1000 marketing-home-specialty__card-title">{card.title}</h3>
      <p className="marketing-home-specialty__card-text p-sm u-opacity-60">{card.body}</p>
    </article>
  )
}

export function HomeSpecialtySection() {
  const sectionRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    gsap.registerPlugin(ScrollTrigger)

    /** Matches `useIsDesktopLg` / `u-lg-only` (64rem). Scroll scrub runs only on desktop grid. */
    const DESKTOP_MQ = '(min-width: 64rem)'

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()

      mm.add(DESKTOP_MQ, () => {
        const grid = section.querySelector('.marketing-home-specialty__grid-bl')
        if (!grid) return

        const visualBls = gsap.utils.toArray<HTMLElement>(
          '.marketing-home-specialty__visual-bl',
          grid,
        )
        const visuals = gsap.utils.toArray<HTMLElement>('.marketing-home-specialty__visual', grid)
        if (visualBls.length === 0 && visuals.length === 0) return

        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        if (reducedMotion) {
          gsap.set(visualBls, { width: '100%' })
          gsap.set(visuals, { scale: 1 })
          return
        }

        gsap.fromTo(
          visualBls,
          { width: '250%' },
          {
            width: '100%',
            ease: 'none',
            scrollTrigger: {
              trigger: section,
              start: 'top 50%',
              end: '75% 50%',
              scrub: true,
              markers: false,
              id: 'specialty-visual-bl',
              invalidateOnRefresh: true,
            },
          },
        )

        gsap.fromTo(
          visuals,
          { scale: 1.7 },
          {
            scale: 1,
            ease: 'none',
            transformOrigin: 'center center',
            scrollTrigger: {
              trigger: section,
              start: 'top 50%',
              end: '75% 50%',
              scrub: true,
              markers: false,
              id: 'specialty-visual',
              invalidateOnRefresh: true,
            },
          },
        )

        const img = grid.querySelector('img')
        if (img && !img.complete) {
          img.addEventListener('load', () => ScrollTrigger.refresh(), { once: true })
        }

        ScrollTrigger.refresh()
      })
    }, section)

    const refresh = () => ScrollTrigger.refresh()
    window.addEventListener('load', refresh)

    return () => {
      window.removeEventListener('load', refresh)
      ctx.revert()
    }
  }, [])

  return (
    <section
      ref={sectionRef}
      className="section marketing-home-specialty"
      aria-labelledby="marketing-home-specialty-heading"
    >
      <div className="container section--pad-lg">
        <div className="row">
          <div className="col col-lg-12">
            <header className="u-ta-center marketing-home-specialty__intro">
              <h2
                id="marketing-home-specialty-heading"
                className="h2 u-color-primary-400 marketing-home-specialty__title"
              >
                Built for your <span className="u-color-primary-600">specialty</span>
              </h2>
              <p className="marketing-home-specialty__lead u-opacity-60">
                Each protocol is tailored to the procedures your patients actually undergo, so the education matches the
                care. Get in touch to receive a demo.
              </p>
              <PartnerContactOpenButton className="marketing-home-specialty__cta">Request a demo</PartnerContactOpenButton>
            </header>
          </div>
        </div>
        <div className="row">
          <div className="col col-lg-12">
            <div className="marketing-home-specialty__grid u-lg-only">
            <div className="marketing-home-specialty__grid-bl">
              <div className="marketing-home-specialty__col marketing-home-specialty__col--left">
                {SPECIALTY_CARDS.slice(0, 3).map((card) => (
                  <SpecialtyCardArticle key={card.id} card={card} />
                ))}
              </div>

              <div className="marketing-home-specialty__visual-wrap">
                <div className="marketing-home-specialty__visual-bl">
                  <Image
                    src="/images/home/doctor-image.png"
                    alt="Clinician with laptop"
                    width={600}
                    height={546}
                    className="marketing-home-specialty__visual"
                    draggable={false}
                    loading="eager"
                  />
                </div>
              </div>

              <div className="marketing-home-specialty__col marketing-home-specialty__col--right">
                {SPECIALTY_CARDS.slice(3, 6).map((card) => (
                  <SpecialtyCardArticle key={card.id} card={card} />
                ))}
              </div>
            </div>
            </div>
            <div className="marketing-home-specialty__mobile-carousel u-lg-hide">
              <Swiper
                className="marketing-home-specialty__swiper marketing-swiper--pad-bottom"
                modules={[Pagination]}
                pagination={{ clickable: true }}
                spaceBetween={16}
                slidesPerView={1}
                breakpoints={{
                  768: { slidesPerView: 2, spaceBetween: 16 },
                }}
                watchOverflow
              >
                {SPECIALTY_CARDS.map((card) => (
                  <SwiperSlide key={card.id} className="marketing-home-specialty__swiper-slide">
                    <SpecialtyCardArticle card={card} />
                  </SwiperSlide>
                ))}
              </Swiper>
              <div className="marketing-home-specialty__visual-wrap marketing-home-specialty__visual-wrap--below-carousel">
                <div className="marketing-home-specialty__visual-bl">
                  <Image
                    src="/images/home/doctor-image.png"
                    alt="Clinician with laptop"
                    width={600}
                    height={546}
                    className="marketing-home-specialty__visual"
                    draggable={false}
                    loading="eager"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

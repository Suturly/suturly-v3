'use client'

import Image from 'next/image'
import { Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'

type EvidenceCard = {
  id: string
  href: string
  imageSrc: string
  imageAlt: string
  sourceLogoSrc: string
  sourceLogoAlt: string
  sourcePrimary: string
  sourceSecondary: string
  headline: string
}

const EVIDENCE_CARDS: EvidenceCard[] = [
  {
    id: 'henn-2020',
    href: 'https://pubmed.ncbi.nlm.nih.gov/?term=Henn+2020+J+Plast+Reconstr+Aesthet+Surg+shared+decision',
    imageSrc: '/images/home/evidence-cover-01.png',
    imageAlt: 'Visual for Henn et al. study on standardized education and shared decision-making',
    sourceLogoSrc: '/images/home/evidence-logo.png',
    sourceLogoAlt: 'Journal of Plastic, Reconstructive & Aesthetic Surgery',
    sourcePrimary: 'Henn et al.',
    sourceSecondary: 'J Plast Reconstr Aesthet Surg, 2020',
    headline: 'Standardized education improves shared decision-making',
  },
  {
    id: 'systematic-reviews',
    href: 'https://pubmed.ncbi.nlm.nih.gov/?term=SMS+patient+education+surgery+systematic+review',
    imageSrc: '/images/home/evidence-cover-02.png',
    imageAlt: 'Visual for systematic reviews on SMS-based surgical education',
    sourceLogoSrc: '/images/home/evidence-logo.png',
    sourceLogoAlt: 'Literature and systematic reviews',
    sourcePrimary: '',
    sourceSecondary: 'Systematic reviews across surgical specialties, 2018-2024',
    headline: 'SMS initiated education drives higher completion',
  },
  {
    id: 'cai-momeni-2022',
    href: 'https://pubmed.ncbi.nlm.nih.gov/?term=Cai+Momeni+2022+Aesthetic+Plast+Surg+patient-reported+outcomes',
    imageSrc: '/images/home/evidence-cover-03.png',
    imageAlt: 'Visual for Cai & Momeni study on patient-reported outcomes',
    sourceLogoSrc: '/images/home/evidence-logo.png',
    sourceLogoAlt: 'Aesthetic Plastic Surgery',
    sourcePrimary: 'Cai & Momeni',
    sourceSecondary: 'Aesthetic Plast Surg, 2022',
    headline: 'Patient-reported outcomes predict long-term satisfaction',
  },
  {
    id: 'azad-2020',
    href: 'https://pubmed.ncbi.nlm.nih.gov/?term=Hernandez-Boussard+2020+J+Surg+Oncol+pain+expectations',
    imageSrc: '/images/home/evidence-cover-04.png',
    imageAlt: 'Visual for Azad, Curtin, Hernandez-Boussard et al. on pain expectations',
    sourceLogoSrc: '/images/home/evidence-logo.png',
    sourceLogoAlt: 'Journal of Surgical Oncology',
    sourcePrimary: 'Azad, Curtin',
    sourceSecondary: 'Hernandez-Boussard et al. J Surg Oncol, 2020',
    headline: 'Pain expectations shape post-surgical experience',
  },
]

function EvidenceCardArrowIcon() {
  return (
    <svg
      className="marketing-home-evidence__card-arrow-svg"
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M16.0039 9.414L7.39691 18.021L5.98291 16.607L14.5889 8H7.00391V6H18.0039V17H16.0039V9.414Z"
        fill="currentColor"
      />
      <path
        d="M16.0039 9.414L7.39691 18.021L5.98291 16.607L14.5889 8H7.00391V6H18.0039V17H16.0039V9.414Z"
        fill="black"
        opacity={0.2}
      />
    </svg>
  )
}

function EvidenceCardSlide({ card }: { card: EvidenceCard }) {
  return (
    <div className="marketing-home-evidence__slide">
      <a
        href={card.href}
        className="marketing-home-evidence__card"
        target="_blank"
        rel="noopener noreferrer"
      >
        <div className="marketing-home-evidence__card-media">
          <Image
            src={card.imageSrc}
            alt={card.imageAlt}
            fill
            sizes="(max-width: 47.99rem) 85vw, (max-width: 63.99rem) 45vw, 22vw"
            className="marketing-home-evidence__card-image-placeholder"
            loading="eager"
          />
          <div className="marketing-home-evidence__card-overlay">
            <div className="marketing-home-evidence__card-source">
              <img
                src={card.sourceLogoSrc}
                alt={card.sourceLogoAlt}
                width={44}
                height={44}
                className="marketing-home-evidence__card-source-logo"
              />
              <div className="marketing-home-evidence__card-source-copy">
                <p className="text-p-sm u-color-primary-50 u-weight-semibold marketing-home-evidence__card-source-primary">
                  {card.sourcePrimary}
                </p>
                <p className="text-caption-p u-color-primary-50 u-opacity-60 marketing-home-evidence__card-source-secondary">
                  {card.sourceSecondary}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="marketing-home-evidence__card-body">
          <p className="text-p-main u-weight-semibold u-color-primary-600 marketing-home-evidence__card-headline">{card.headline}</p>
          <span className="marketing-home-evidence__card-arrow" aria-hidden>
            <EvidenceCardArrowIcon />
          </span>
        </div>
      </a>
    </div>
  )
}

export function HomeEvidenceSection() {
  return (
    <section
      id="evidence"
      className="section marketing-home-evidence section--pad-lg"
      aria-labelledby="marketing-home-evidence-heading"
    >
      <div className="container">
        <h2 id="marketing-home-evidence-heading" className="h3 u-color-primary-1000 marketing-home-evidence__title">
          Evidence-based, <span className="u-opacity-40">not guesswork</span>
        </h2>

        <div
          className="marketing-home-evidence__viewport marketing-swiper--pad-bottom marketing-swiper--hide-pagination-desktop"
          data-marketing-evidence-carousel
        >
          <Swiper
            className="marketing-home-evidence__swiper"
            modules={[Pagination]}
            pagination={{ clickable: true }}
            spaceBetween={8}
            slidesPerView={1}
            breakpoints={{
              768: { slidesPerView: 2, spaceBetween: 8 },
              1024: { slidesPerView: 4, spaceBetween: 8 },
            }}
            watchOverflow
          >
            {EVIDENCE_CARDS.map((card) => (
              <SwiperSlide key={card.id} className="marketing-home-evidence__swiper-slide">
                <EvidenceCardSlide card={card} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  )
}

'use client'

import Image from 'next/image'
import { Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'

type AdditionalFeature = {
  id: string
  imageSrc: string
  imageAlt: string
  title: string
  body: string
}

const FEATURES: AdditionalFeature[] = [
  {
    id: 'protocol-driven',
    imageSrc: '/images/home/features-01.png',
    imageAlt: 'additional features',
    title: 'Protocol-driven, not static',
    body: 'Build procedure-specific care timelines with staged touchpoints — from pre-op through recovery. One protocol per procedure, fully customizable.',
  },
  {
    id: 'protocol-driven-2',
    imageSrc: '/images/home/features-02.png',
    imageAlt: 'additional features',
    title: 'Protocol-driven, not static',
    body: 'Build procedure-specific care timelines with staged touchpoints — from pre-op through recovery. One protocol per procedure, fully customizable.',
  },
  {
    id: 'protocol-driven-3',
    imageSrc: '/images/home/features-03.png',
    imageAlt: 'additional features',
    title: 'Protocol-driven, not static',
    body: 'Build procedure-specific care timelines with staged touchpoints — from pre-op through recovery. One protocol per procedure, fully customizable.',
  },
]

export function PlatformAdditionalFeaturesCarousel() {
  return (
    <Swiper
      className="platform-additional-swiper marketing-swiper--pad-bottom marketing-swiper--hide-pagination-desktop"
      modules={[Pagination]}
      pagination={{ clickable: true }}
      spaceBetween={24}
      slidesPerView={1}
      breakpoints={{
        768: { slidesPerView: 2, spaceBetween: 24 },
        1024: { slidesPerView: 3, spaceBetween: 24 },
      }}
      watchOverflow
    >
      {FEATURES.map((item) => (
        <SwiperSlide key={item.id} className="platform-additional-swiper__slide">
          <div className="platform-section-additional-features">
            <div className="platform-section-additional-features__img-wrap">
              <Image
                src={item.imageSrc}
                alt={item.imageAlt}
                fill
                sizes="(max-width: 47.99rem) 90vw, (max-width: 63.99rem) 45vw, 30vw"
                className="platform-section-additional-features__img"
                priority
              />
            </div>
            <div className="platform-section-additional-features__content">
              <h3 className="h6 u-color-gray-900 platform-section-additional-features__title">{item.title}</h3>
              <p className="-color-secondary-500 u-opacity-60 platform-section-additional-features__text">{item.body}</p>
            </div>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  )
}

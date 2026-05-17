'use client'

import NextImage from 'next/image'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import type { LightboxSlide } from '@/utilities/lightboxSlides'
import { cn } from '@/utilities/ui'

const LIGHTBOX_Z = 200000
/** Above dialog chrome and inner arrows so the close control stays tappable. */
const LIGHTBOX_CLOSE_Z = LIGHTBOX_Z + 1

type Props = {
  initialIndex: number
  onClose: () => void
  open: boolean
  slides: LightboxSlide[]
}

export function ImageLightbox({ initialIndex, onClose, open, slides }: Props) {
  const [mounted, setMounted] = useState(false)
  const [index, setIndex] = useState(initialIndex)
  const touchStartX = useRef<number | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (open) {
      setIndex(Math.min(Math.max(0, initialIndex), Math.max(0, slides.length - 1)))
    }
  }, [open, initialIndex, slides.length])

  const goPrev = useCallback(() => {
    setIndex((i) => (i <= 0 ? slides.length - 1 : i - 1))
  }, [slides.length])

  const goNext = useCallback(() => {
    setIndex((i) => (i >= slides.length - 1 ? 0 : i + 1))
  }, [slides.length])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (slides.length < 2) return
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goPrev()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        goNext()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    const prevHtmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
      document.documentElement.style.overflow = prevHtmlOverflow
    }
  }, [open, onClose, goPrev, goNext, slides.length])

  if (!mounted || !open || slides.length === 0) return null

  const slide = slides[index]
  if (!slide) return null

  const isSvgString =
    typeof slide.src === 'string' &&
    (slide.src.toLowerCase().includes('.svg') || slide.src.includes('image/svg'))

  const multi = slides.length > 1

  const node = (
    <div
      aria-modal="true"
      className="fixed inset-0 flex items-center justify-center p-3 sm:p-5"
      role="dialog"
      style={{ zIndex: LIGHTBOX_Z }}
    >
      <button
        aria-label="Close image viewer"
        className="absolute inset-0 border-0 bg-black/92 p-0"
        type="button"
        onClick={onClose}
      />

      <button
        aria-label="Close"
        className={cn(
          'fixed flex h-11 w-11 items-center justify-center rounded-full border-0 sm:h-12 sm:w-12',
          'bg-white/12 text-white shadow-md transition hover:bg-white/22',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
          'right-[max(1rem,env(safe-area-inset-right,0px))] top-[max(1rem,env(safe-area-inset-top,0px))]',
        )}
        style={{ zIndex: LIGHTBOX_CLOSE_Z }}
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
      >
        <svg aria-hidden className="h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
        </svg>
      </button>

      <div
        className="relative z-1 flex max-h-[min(92dvh,960px)] w-full max-w-[min(100vw-1.5rem,1240px)] flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {multi && (
          <>
            <button
              aria-label="Previous image"
              className={cn(
                'absolute left-0 top-1/2 z-2 flex h-12 w-12 -translate-x-1 -translate-y-1/2 items-center justify-center',
                'rounded-full border-0 bg-white/12 text-white shadow-md sm:h-14 sm:w-14 sm:-translate-x-2',
                'transition hover:bg-white/22 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
                'min-h-[44px] min-w-[44px]',
              )}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                goPrev()
              }}
            >
              <svg aria-hidden className="h-7 w-7" fill="none" viewBox="0 0 24 24">
                <path
                  d="M14 6l-6 6 6 6"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            </button>
            <button
              aria-label="Next image"
              className={cn(
                'absolute right-0 top-1/2 z-2 flex h-12 w-12 translate-x-1 -translate-y-1/2 items-center justify-center',
                'rounded-full border-0 bg-white/12 text-white shadow-md sm:h-14 sm:w-14 sm:translate-x-2',
                'transition hover:bg-white/22 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
                'min-h-[44px] min-w-[44px]',
              )}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                goNext()
              }}
            >
              <svg aria-hidden className="h-7 w-7" fill="none" viewBox="0 0 24 24">
                <path
                  d="M10 6l6 6-6 6"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
              </svg>
            </button>
          </>
        )}

        <div
          className={cn(
            'relative mt-10 w-full flex-1 sm:mt-12',
            'flex items-center justify-center',
          )}
          onTouchStart={(e) => {
            if (!multi || e.touches.length === 0) return
            touchStartX.current = e.touches[0].clientX
          }}
          onTouchEnd={(e) => {
            if (!multi || touchStartX.current === null) return
            const endX = e.changedTouches[0]?.clientX
            if (endX === undefined) return
            const dx = endX - touchStartX.current
            touchStartX.current = null
            if (Math.abs(dx) < 56) return
            if (dx > 0) goPrev()
            else goNext()
          }}
        >
          <div className="relative h-[min(85dvh,900px)] w-full max-w-full">
            <NextImage
              alt={slide.alt}
              className="object-contain object-center"
              fill
              priority
              quality={88}
              sizes="100vw"
              src={slide.src}
              unoptimized={isSvgString}
            />
          </div>
        </div>

        {multi && (
        <div
          aria-hidden
          className="mt-3 flex shrink-0 items-center justify-center gap-2 pb-4"
        >
            {slides.map((_, i) => (
              <button
                key={i}
                aria-current={i === index}
                aria-label={`Image ${i + 1} of ${slides.length}`}
                className={cn(
                  'h-2.5 w-2.5 rounded-full border-0 p-0 transition sm:h-3 sm:w-3',
                  i === index ? 'scale-110 bg-white' : 'bg-white/35 hover:bg-white/55',
                )}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setIndex(i)
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(node, document.body)
}

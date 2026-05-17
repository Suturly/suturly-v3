'use client'

import React, { useState } from 'react'

import type { LightboxSlide } from '@/utilities/lightboxSlides'
import { cn } from '@/utilities/ui'

import { ImageLightbox } from './ImageLightbox.client'

type Props = {
  children: React.ReactNode
  /** Optional wrapper class for the clickable trigger (e.g. float layouts). */
  className?: string
  slides: LightboxSlide[]
  /** Which slide in `slides` opens when this image is clicked. */
  startIndex: number
}

export const LightboxImageTrigger: React.FC<Props> = ({
  children,
  className,
  slides,
  startIndex,
}) => {
  const [open, setOpen] = useState(false)

  if (slides.length === 0) {
    return <>{children}</>
  }

  const label =
    slides.length > 1
      ? `Open image viewer (image ${startIndex + 1} of ${slides.length})`
      : 'Open larger image'

  return (
    <>
      <button
        aria-label={label}
        className={cn(
          'block w-full cursor-zoom-in touch-manipulation border-0 bg-transparent p-0 text-left',
          'focus-visible:ring-2 focus-visible:ring-[var(--accent-500)] focus-visible:ring-offset-2',
          className,
        )}
        type="button"
        onClick={() => setOpen(true)}
      >
        {children}
      </button>
      <ImageLightbox
        initialIndex={startIndex}
        open={open}
        slides={slides}
        onClose={() => setOpen(false)}
      />
    </>
  )
}

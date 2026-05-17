import React from 'react'

import { LightboxImageTrigger } from '@/components/ImageLightbox/LightboxImageTrigger.client'
import { Media } from '@/components/Media'
import { cn } from '@/utilities/ui'
import { lightboxSlideFromPayloadMedia } from '@/utilities/lightboxSlides'

type Props = {
  media?: object | string | number | null
  float?: 'left' | 'right'
  className?: string
}

export const FloatImage: React.FC<Props> = ({ media, float = 'right', className }) => {
  const floatClass =
    float === 'left' ? 'resource-block-float-image--left' : 'resource-block-float-image--right'

  const slide = lightboxSlideFromPayloadMedia(media)
  const slides = slide ? [slide] : []

  return (
    <div className={cn('not-prose resource-block-float-image', floatClass, className)}>
      <LightboxImageTrigger slides={slides} startIndex={0}>
        <Media
          resource={media as string | number | null}
          imgClassName="resource-block-media-image"
        />
      </LightboxImageTrigger>
    </div>
  )
}

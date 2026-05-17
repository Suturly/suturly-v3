import React from 'react'

import { LightboxImageTrigger } from '@/components/ImageLightbox/LightboxImageTrigger.client'
import RichText from '@/components/RichText'
import { Media } from '@/components/Media'
import { cn } from '@/utilities/ui'
import { lightboxSlideFromPayloadMedia } from '@/utilities/lightboxSlides'
import { resolveCaptionPriority } from '@/utilities/resolveBlockCaption'
import type { Media as MediaType, TwoColumnImagesBlock } from '@/payload-types'

type Props = Partial<
  Pick<TwoColumnImagesBlock, 'leftCustomCaption' | 'rightCustomCaption'>
> & {
  leftImage?: object | string | number | null
  rightImage?: object | string | number | null
  className?: string
  citationHrefs?: Record<string, string>
  citationLinkLabels?: Record<string, string>
  linkCitations?: Record<string, number>
}

function captionFromUpload(resource: unknown): MediaType['caption'] | undefined {
  if (resource && typeof resource === 'object' && 'caption' in resource) {
    return (resource as MediaType).caption ?? undefined
  }
  return undefined
}

export const TwoColumnImages: React.FC<Props> = ({
  leftImage,
  rightImage,
  leftCustomCaption,
  rightCustomCaption,
  className,
  citationHrefs,
  citationLinkLabels,
  linkCitations,
}) => {
  const leftCaption = resolveCaptionPriority(leftCustomCaption, captionFromUpload(leftImage))
  const rightCaption = resolveCaptionPriority(rightCustomCaption, captionFromUpload(rightImage))

  const leftSlide = lightboxSlideFromPayloadMedia(leftImage)
  const rightSlide = lightboxSlideFromPayloadMedia(rightImage)
  const lightboxSlides = [leftSlide, rightSlide].filter((s): s is NonNullable<typeof s> => s != null)
  const rightStartIndex = leftSlide && rightSlide ? 1 : 0

  return (
    <div className={cn('not-prose resource-block-two-column-images', className)}>
      <div className="resource-block-two-column-images__figure">
        {leftSlide ? (
          <LightboxImageTrigger slides={lightboxSlides} startIndex={0}>
            <Media
              resource={leftImage as string | number | null}
              imgClassName="resource-block-media-image"
            />
          </LightboxImageTrigger>
        ) : (
          <Media
            resource={leftImage as string | number | null}
            imgClassName="resource-block-media-image"
          />
        )}
        {leftCaption ? (
          <div className="resource-block-two-column-images__caption">
            <RichText
              citationHrefs={citationHrefs}
              citationLinkLabels={citationLinkLabels}
              data={leftCaption}
              enableGutter={false}
              linkCitations={linkCitations}
            />
          </div>
        ) : null}
      </div>
      <div className="resource-block-two-column-images__figure">
        {rightSlide ? (
          <LightboxImageTrigger slides={lightboxSlides} startIndex={rightStartIndex}>
            <Media
              resource={rightImage as string | number | null}
              imgClassName="resource-block-media-image"
            />
          </LightboxImageTrigger>
        ) : (
          <Media
            resource={rightImage as string | number | null}
            imgClassName="resource-block-media-image"
          />
        )}
        {rightCaption ? (
          <div className="resource-block-two-column-images__caption">
            <RichText
              citationHrefs={citationHrefs}
              citationLinkLabels={citationLinkLabels}
              data={rightCaption}
              enableGutter={false}
              linkCitations={linkCitations}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}

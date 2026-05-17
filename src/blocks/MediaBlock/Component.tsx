import type { StaticImageData } from 'next/image'

import { LightboxImageTrigger } from '@/components/ImageLightbox/LightboxImageTrigger.client'
import RichText from '@/components/RichText'
import { cn } from '@/utilities/ui'
import {
  lightboxSlideFromPayloadMedia,
  lightboxSlideFromStaticImage,
} from '@/utilities/lightboxSlides'
import { resolveCaptionPriority } from '@/utilities/resolveBlockCaption'

import type { MediaBlock as MediaBlockProps } from '@/payload-types'

import { Media } from '../../components/Media'

type Props = MediaBlockProps & {
  captionClassName?: string
  className?: string
  enableGutter?: boolean
  imgClassName?: string
  staticImage?: StaticImageData
  disableInnerContainer?: boolean
  citationHrefs?: Record<string, string>
  citationLinkLabels?: Record<string, string>
  linkCitations?: Record<string, number>
}

export const MediaBlock: React.FC<Props> = (props) => {
  const {
    captionClassName,
    className,
    customCaption,
    enableGutter = true,
    imgClassName,
    media,
    staticImage,
    disableInnerContainer,
    citationHrefs,
    citationLinkLabels,
    linkCitations,
  } = props

  const mediaCaption = media && typeof media === 'object' ? media.caption : undefined
  const caption = resolveCaptionPriority(customCaption, mediaCaption)

  const lightboxSlides = staticImage
    ? [lightboxSlideFromStaticImage(staticImage)]
    : (() => {
        const s = lightboxSlideFromPayloadMedia(media)
        return s ? [s] : []
      })()

  return (
    <div
      className={cn(
        'big-image-wrapper',
        {
          container: enableGutter,
        },
        className,
      )}
    >
      {(media || staticImage) && (
        <LightboxImageTrigger slides={lightboxSlides} startIndex={0}>
          <Media
            imgClassName={cn('border border-border rounded-[0.8rem]', imgClassName)}
            resource={media}
            src={staticImage}
          />
        </LightboxImageTrigger>
      )}
      {caption && (
        <div
          className={cn(
            'resource-block-two-column-images__caption',
            {
              container: !disableInnerContainer,
            },
            captionClassName,
          )}
        >
          <RichText
            citationHrefs={citationHrefs}
            citationLinkLabels={citationLinkLabels}
            data={caption}
            enableGutter={false}
            linkCitations={linkCitations}
          />
        </div>
      )}
    </div>
  )
}

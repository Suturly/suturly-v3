import type { StaticImageData } from 'next/image'

import type { Media as MediaType } from '@/payload-types'
import { getMediaUrl } from '@/utilities/getMediaUrl'

/**
 * Data for {@link ImageLightbox} / {@link LightboxImageTrigger}. Matches what
 * {@link components/Media/ImageMedia} resolves from Payload resources.
 */
export type LightboxSlide = {
  alt: string
  height?: number
  src: string | StaticImageData
  width?: number
}

export function lightboxSlideFromPayloadMedia(resource: unknown): LightboxSlide | null {
  if (!resource || typeof resource !== 'object') return null
  const r = resource as MediaType
  if (!r.url) return null
  return {
    alt: typeof r.alt === 'string' ? r.alt : '',
    height: r.height ?? undefined,
    src: getMediaUrl(r.url, r.updatedAt),
    width: r.width ?? undefined,
  }
}

export function lightboxSlideFromStaticImage(staticData: StaticImageData): LightboxSlide {
  return {
    alt: '',
    height: staticData.height,
    src: staticData,
    width: staticData.width,
  }
}

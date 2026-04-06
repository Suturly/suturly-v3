import React from 'react'

import RichText from '@/components/RichText'
import { Media } from '@/components/Media'
import { cn } from '@/utilities/ui'
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

  return (
    <div className={cn('not-prose resource-block-two-column-images', className)}>
      <div className="resource-block-two-column-images__figure">
        <Media
          resource={leftImage as string | number | null}
          imgClassName="resource-block-media-image"
        />
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
        <Media
          resource={rightImage as string | number | null}
          imgClassName="resource-block-media-image"
        />
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

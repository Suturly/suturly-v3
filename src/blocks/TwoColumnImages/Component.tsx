import React from 'react'

import { Media } from '@/components/Media'
import { cn } from '@/utilities/ui'

type Props = {
  leftImage?: object | string | number | null
  rightImage?: object | string | number | null
  className?: string
}

export const TwoColumnImages: React.FC<Props> = ({ leftImage, rightImage, className }) => {
  return (
    <div className={cn('not-prose resource-block-two-column-images', className)}>
      <Media
        resource={leftImage as string | number | null}
        imgClassName="resource-block-media-image"
      />
      <Media
        resource={rightImage as string | number | null}
        imgClassName="resource-block-media-image"
      />
    </div>
  )
}

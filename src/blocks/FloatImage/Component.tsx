import React from 'react'

import { Media } from '@/components/Media'
import { cn } from '@/utilities/ui'

type Props = {
  media?: object | string | number | null
  float?: 'left' | 'right'
  className?: string
}

export const FloatImage: React.FC<Props> = ({ media, float = 'right', className }) => {
  const floatClass =
    float === 'left' ? 'resource-block-float-image--left' : 'resource-block-float-image--right'

  return (
    <div className={cn('not-prose resource-block-float-image', floatClass, className)}>
      <Media
        resource={media as string | number | null}
        imgClassName="resource-block-media-image"
      />
    </div>
  )
}

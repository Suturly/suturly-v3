import type { BannerBlock as BannerBlockProps } from 'src/payload-types'

import { cn } from '@/utilities/ui'
import React from 'react'
import RichText from '@/components/RichText'

type Props = {
  className?: string
  linkCitations?: Record<string, number>
} & BannerBlockProps

export const BannerBlock: React.FC<Props> = ({ className, content, style, linkCitations }) => {
  return (
    <div className={cn('not-prose resource-block-banner', className)}>
      <div
        className={cn('resource-block-banner__inner', {
          'resource-block-banner__inner--warning': style === 'warning',
        })}
      >
        <RichText
          data={content}
          enableGutter={false}
          enableProse={false}
          linkCitations={linkCitations}
        />
      </div>
    </div>
  )
}

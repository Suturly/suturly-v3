import React from 'react'

import type { CallToActionBlock as CTABlockProps } from '@/payload-types'

import RichText from '@/components/RichText'
import { CMSLink } from '@/components/Link'

type Props = CTABlockProps & {
  citationHrefs?: Record<string, string>
  citationLinkLabels?: Record<string, string>
  linkCitations?: Record<string, number>
}

export const CallToActionBlock: React.FC<Props> = ({
  links,
  richText,
  citationHrefs,
  citationLinkLabels,
  linkCitations,
}) => {
  return (
    <div className="container">
      <div className="bg-card rounded border-border border p-4 flex flex-col gap-8 md:flex-row md:justify-between md:items-center">
        <div className="max-w-[48rem] flex items-center">
          {richText && (
            <RichText
              citationHrefs={citationHrefs}
              citationLinkLabels={citationLinkLabels}
              className="mb-0"
              data={richText}
              enableGutter={false}
              linkCitations={linkCitations}
            />
          )}
        </div>
        <div className="flex flex-col gap-8">
          {(links || []).map(({ link }, i) => {
            return <CMSLink key={i} size="big" {...link} />
          })}
        </div>
      </div>
    </div>
  )
}

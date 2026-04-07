'use client'

import type { Media } from '@/payload-types'
import { Media as MediaComponent } from '@/components/Media'
import React from 'react'

type BenefitTag = {
  text: string
  icon: Media | null
}

type Props = {
  tags: BenefitTag[]
}

const MIN_VISIBLE_TAGS = 1

export const BenefitTagsInline: React.FC<Props> = ({ tags }) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const measureTagRefs = React.useRef<Array<HTMLSpanElement | null>>([])
  const measureOverflowRef = React.useRef<HTMLSpanElement | null>(null)
  const [visibleCount, setVisibleCount] = React.useState(tags.length)

  const recalculate = React.useCallback(() => {
    const container = containerRef.current
    if (!container || tags.length === 0) {
      setVisibleCount(0)
      return
    }

    const tagWidths = tags.map((_, index) => measureTagRefs.current[index]?.offsetWidth ?? 0)
    if (tagWidths.length === 0) {
      setVisibleCount(0)
      return
    }

    const containerWidth = container.clientWidth
    const styles = window.getComputedStyle(container)
    const gap = Number.parseFloat(styles.columnGap || styles.gap || '0') || 0
    const overflowTemplateWidth = measureOverflowRef.current?.offsetWidth ?? 0

    let nextVisibleCount = tags.length

    for (let count = tags.length; count >= MIN_VISIBLE_TAGS; count -= 1) {
      const hiddenCount = tags.length - count
      const hasOverflow = hiddenCount > 0
      const overflowWidth = hasOverflow ? overflowTemplateWidth : 0
      const visibleWidths = tagWidths.slice(0, count).reduce((sum, width) => sum + width, 0)
      const totalItems = count + (hasOverflow ? 1 : 0)
      const gaps = totalItems > 1 ? gap * (totalItems - 1) : 0
      const requiredWidth = visibleWidths + overflowWidth + gaps

      if (requiredWidth <= containerWidth) {
        nextVisibleCount = count
        break
      }
    }

    setVisibleCount(nextVisibleCount)
  }, [tags])

  React.useEffect(() => {
    recalculate()

    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(() => recalculate())
    observer.observe(container)

    return () => observer.disconnect()
  }, [recalculate])

  React.useEffect(() => {
    const onResize = () => recalculate()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [recalculate])

  const hiddenCount = Math.max(tags.length - visibleCount, 0)
  const visibleTags = tags.slice(0, visibleCount)

  return (
    <>
      <div className="resource-card__tags" ref={containerRef}>
        {visibleTags.map((tag, index) => (
          <span className="resource-card__tag" key={`benefit-tag-${index}`}>
            {tag.icon ? (
              <span className="resource-card__tag-icon-wrap">
                <MediaComponent
                  className="resource-card__tag-icon-media"
                  imgClassName="resource-card__tag-icon"
                  resource={tag.icon}
                />
              </span>
            ) : null}
            {tag.text}
          </span>
        ))}
        {hiddenCount > 0 && <span className="resource-card__tag resource-card__tag--more">+{hiddenCount}</span>}
      </div>

      <div aria-hidden className="resource-card__tags-measure">
        {tags.map((tag, index) => (
          <span
            className="resource-card__tag"
            key={`benefit-tag-measure-${index}`}
            ref={(el) => {
              measureTagRefs.current[index] = el
            }}
          >
            <span className="resource-card__tag-icon-wrap" />
            {tag.text}
          </span>
        ))}
        <span className="resource-card__tag resource-card__tag--more" ref={measureOverflowRef}>
          +999
        </span>
      </div>
    </>
  )
}

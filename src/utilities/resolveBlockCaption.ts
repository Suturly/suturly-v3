import { hasText } from '@payloadcms/richtext-lexical/shared'

import type { Media } from '@/payload-types'

type LexicalCaption = NonNullable<Media['caption']>

/**
 * Custom caption on a block wins when it has text; otherwise use the upload’s library caption.
 */
export function resolveCaptionPriority(
  custom: LexicalCaption | null | undefined,
  fromMedia: LexicalCaption | null | undefined,
): LexicalCaption | undefined {
  if (custom && hasText(custom)) return custom
  if (fromMedia && hasText(fromMedia)) return fromMedia
  return undefined
}

'use client'

import type { Post } from '@/payload-types'
import { RowLabelProps, useRowLabel } from '@payloadcms/ui'
import type { FC } from 'react'

export const CitationsRowLabel: FC<RowLabelProps> = () => {
  const data = useRowLabel<NonNullable<Post['citations']>[number]>()

  const bib =
    typeof data?.data?.bibliography === 'string' ? data.data.bibliography.trim() : ''

  const label = bib
    ? bib.length > 64
      ? `${bib.slice(0, 64)}…`
      : bib
    : data?.rowNumber !== undefined
      ? `Citation ${data.rowNumber + 1}`
      : 'Citation'

  return <div>{label}</div>
}

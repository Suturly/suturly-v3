import clsx from 'clsx'
import React from 'react'

interface Props {
  className?: string
  loading?: 'lazy' | 'eager'
  priority?: 'auto' | 'high' | 'low'
}

export const Logo = (props: Props) => {
  const { loading: loadingFromProps, priority: priorityFromProps, className } = props

  const loading = loadingFromProps || 'lazy'
  const priority = priorityFromProps || 'low'

  return (
    /* eslint-disable @next/next/no-img-element */
    <img
      alt="Suturly Logo"
      width={112}
      height={32}
      loading={loading}
      fetchPriority={priority}
      decoding="async"
      className={clsx('max-w-[var(--space-7)] w-full h-[var(--space-2)]', className)}
      src="/logo.svg"
    />
  )
}

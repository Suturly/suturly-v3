'use client'

import { useSyncExternalStore } from 'react'

/** Matches `theme(--breakpoint-lg)` (64rem) — desktop marketing layout. */
const QUERY = '(min-width: 64rem)'

export function useIsDesktopLg() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(QUERY)
      mq.addEventListener('change', onChange)
      return () => mq.removeEventListener('change', onChange)
    },
    () => window.matchMedia(QUERY).matches,
    () => false,
  )
}

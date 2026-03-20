'use client'

import { useMemo } from 'react'

import { useModalContext } from './context'

/**
 * Global modal API. Must be used under `ModalProvider`.
 *
 * @example
 * ```tsx
 * const { openModal, closeModal, isOpen } = useModal()
 *
 * openModal({
 *   initialScreenKey: 'intro',
 *   screens: {
 *     intro: {
 *       title: 'Welcome',
 *       content: (m) => <p>Step one.</p>,
 *       actions: [
 *         { label: 'Next', nextScreenKey: 'details' },
 *       ],
 *     },
 *     details: {
 *       title: 'Details',
 *       content: <p>More info.</p>,
 *       actions: [
 *         { label: 'Done', variant: 'outline', closeOnClick: true },
 *       ],
 *     },
 *   },
 * })
 * ```
 */
export function useModal() {
  const { state, openModal, closeModal, api } = useModalContext()

  return useMemo(
    () => ({
      openModal,
      closeModal,
      /** Same `api` passed to screen `content` render prop */
      api,
      isOpen: state.open,
    }),
    [state.open, openModal, closeModal, api],
  )
}

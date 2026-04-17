'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/utilities/ui'
import type { ModalShellVariant, ModalState } from './types'
import { ArrowLeft, X } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useId,
  useReducer,
  useRef,
  useState,
  type PointerEvent,
} from 'react'
import { createPortal } from 'react-dom'

import { useModalContext } from './context'

type ModalOpenState = Extract<ModalState, { open: true }>

/** Matches globals.css transitions (backdrop + dialog share 0.25s) */
const MODAL_EXIT_MS = 280

export function ModalRoot() {
  const { state, api, closeModal } = useModalContext()
  const reactId = useId()
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const [, exitDone] = useReducer((n: number) => n + 1, 0)
  const frozenOpenRef = useRef<ModalOpenState | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (state.open) {
    frozenOpenRef.current = state
  }

  const view = state.open ? state : frozenOpenRef.current
  const shouldRenderPortal = mounted && view !== null

  useEffect(() => {
    if (!state.open) return

    setVisible(false)
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true))
    })
    return () => cancelAnimationFrame(id)
  }, [state.open])

  useEffect(() => {
    if (state.open) return
    if (!frozenOpenRef.current) return

    setVisible(false)
    const t = window.setTimeout(() => {
      frozenOpenRef.current = null
      exitDone()
    }, MODAL_EXIT_MS)

    return () => window.clearTimeout(t)
  }, [state.open])

  useEffect(() => {
    if (!shouldRenderPortal || view === null) return

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [shouldRenderPortal, view])

  useEffect(() => {
    if (!state.open) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeModal()
      }
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [state.open, closeModal])

  const onOverlayPointerDown = useCallback(
    (e: PointerEvent<HTMLButtonElement>) => {
      if (e.target === e.currentTarget) closeModal()
    },
    [closeModal],
  )

  if (!shouldRenderPortal || !view) {
    return null
  }

  const titleId = `${reactId}-modal-title`
  const currentKey = view.stack[view.stack.length - 1]
  const screen = view.screens[currentKey]
  if (!screen) return null

  const canGoBack = view.stack.length > 1

  const contentNode =
    typeof screen.content === 'function' ? screen.content(api) : screen.content

  const shellVariant: ModalShellVariant = view.variant

  const runAction = (action: (typeof screen.actions)[number]) => () => {
    action.onClick?.(api)
    if (action.replaceScreenKey) api.replaceScreen(action.replaceScreenKey)
    else if (action.nextScreenKey) api.pushScreen(action.nextScreenKey)
    if (action.closeOnClick) api.closeModal()
  }

  return createPortal(
    <div
      aria-labelledby={titleId}
      aria-modal="true"
      className={cn(
        'global-modal',
        visible && 'global-modal--visible',
        shellVariant === 'marketing' && 'global-modal--marketing',
      )}
      role="dialog"
    >
      <button
        aria-hidden
        className="global-modal__backdrop"
        onPointerDown={onOverlayPointerDown}
        tabIndex={-1}
        type="button"
      />
      <div
        className={cn(
          'global-modal__dialog',
          shellVariant === 'marketing' && 'global-modal__dialog--marketing',
        )}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="global-modal__header">
          <div className="global-modal__header-main">
            {canGoBack ? (
              <Button
                aria-label="Back"
                className="global-modal__back"
                onClick={() => api.goBack()}
                size="icon"
                type="button"
                variant="ghost"
              >
                <ArrowLeft aria-hidden className="global-modal__icon" />
              </Button>
            ) : null}
            {shellVariant === 'marketing' ? (
              <h3 className="global-modal__title global-modal__title--marketing" id={titleId}>
                {screen.title}
              </h3>
            ) : (
              <h2 className="global-modal__title" id={titleId}>
                {screen.title}
              </h2>
            )}
          </div>
          {shellVariant === 'marketing' ? null : (
            <Button
              aria-label="Close"
              className="global-modal__close"
              onClick={closeModal}
              size="icon"
              type="button"
              variant="ghost"
            >
              <X aria-hidden className="global-modal__icon" />
            </Button>
          )}
        </div>

        <div className="global-modal__body">{contentNode}</div>

        <div className="global-modal__footer">
          {screen.actions.map((action, index) => (
            <Button
              key={`${currentKey}-action-${index}`}
              className={action.className}
              onClick={runAction(action)}
              size={action.size ?? 'big'}
              type="button"
              variant={action.variant ?? 'default'}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  )
}

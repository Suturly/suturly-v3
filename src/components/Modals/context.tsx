'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from 'react'

import type { ModalApi, ModalShellVariant, ModalState, OpenModalConfig } from './types'

type ModalAction =
  | { type: 'CLOSE' }
  | {
      type: 'OPEN'
      id: string
      screens: OpenModalConfig['screens']
      initialScreenKey: string
      variant: ModalShellVariant
    }
  | { type: 'PUSH'; key: string }
  | { type: 'REPLACE'; key: string }
  | { type: 'POP' }

function modalReducer(state: ModalState, action: ModalAction): ModalState {
  switch (action.type) {
    case 'CLOSE':
      return { open: false }
    case 'OPEN':
      if (!action.screens[action.initialScreenKey]) return state
      return {
        open: true,
        id: action.id,
        screens: action.screens,
        stack: [action.initialScreenKey],
        variant: action.variant,
      }
    case 'PUSH': {
      if (!state.open) return state
      if (!state.screens[action.key]) return state
      return { ...state, stack: [...state.stack, action.key] }
    }
    case 'REPLACE': {
      if (!state.open) return state
      if (!state.screens[action.key]) return state
      if (state.stack.length === 0) return state
      return {
        ...state,
        stack: [...state.stack.slice(0, -1), action.key],
      }
    }
    case 'POP': {
      if (!state.open) return state
      if (state.stack.length <= 1) return state
      return { ...state, stack: state.stack.slice(0, -1) }
    }
    default:
      return state
  }
}

function validateScreens(screens: OpenModalConfig['screens']): boolean {
  for (const [key, screen] of Object.entries(screens)) {
    const n = screen.actions?.length ?? 0
    if (n < 1 || n > 3) {
      console.error(`[Modal] Screen "${key}" must have 1–3 actions, got ${n}.`)
      return false
    }
  }
  return true
}

export type ModalContextValue = {
  state: ModalState
  openModal: (config: OpenModalConfig) => void
  closeModal: () => void
  api: ModalApi
}

const ModalContext = createContext<ModalContextValue | null>(null)

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(modalReducer, { open: false })

  const closeModal = useCallback(() => {
    dispatch({ type: 'CLOSE' })
  }, [])

  const openModal = useCallback((config: OpenModalConfig) => {
    if (!config.screens[config.initialScreenKey]) {
      console.error('[Modal] initialScreenKey is not present in screens.')
      return
    }
    if (!validateScreens(config.screens)) return

    dispatch({
      type: 'OPEN',
      id: config.id ?? `modal-${Date.now()}`,
      screens: config.screens,
      initialScreenKey: config.initialScreenKey,
      variant: config.variant ?? 'default',
    })
  }, [])

  const api = useMemo<ModalApi>(
    () => ({
      pushScreen: (key) => dispatch({ type: 'PUSH', key }),
      replaceScreen: (key) => dispatch({ type: 'REPLACE', key }),
      goBack: () => dispatch({ type: 'POP' }),
      closeModal,
    }),
    [closeModal],
  )

  const value = useMemo<ModalContextValue>(
    () => ({
      state,
      openModal,
      closeModal,
      api,
    }),
    [state, openModal, closeModal, api],
  )

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>
}

/** @internal Used by ModalRoot and useModal */
export function useModalContext(): ModalContextValue {
  const ctx = useContext(ModalContext)
  if (!ctx) {
    throw new Error('Modal components must be used within ModalProvider.')
  }
  return ctx
}

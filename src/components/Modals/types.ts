import type { ReactNode } from 'react'

import type { ButtonProps } from '@/components/ui/button'

export type ModalApi = {
  pushScreen: (screenKey: string) => void
  replaceScreen: (screenKey: string) => void
  goBack: () => void
  closeModal: () => void
}

export type ModalActionConfig = {
  label: string
  variant?: ButtonProps['variant']
  size?: ButtonProps['size']
  /** Runs first; then optional navigation / close */
  onClick?: (api: ModalApi) => void
  /** Push after onClick */
  nextScreenKey?: string
  /** Replace top screen after onClick */
  replaceScreenKey?: string
  /** Close after onClick + optional navigation (default false) */
  closeOnClick?: boolean
}

export type ModalScreenConfig = {
  title: string
  content: ReactNode | ((api: ModalApi) => ReactNode)
  /** 1–3 footer actions */
  actions: ModalActionConfig[]
}

export type OpenModalConfig = {
  /** Stable id for a11y; auto-generated if omitted */
  id?: string
  initialScreenKey: string
  screens: Record<string, ModalScreenConfig>
}

export type ModalState =
  | { open: false }
  | {
      open: true
      id: string
      screens: Record<string, ModalScreenConfig>
      stack: string[]
    }

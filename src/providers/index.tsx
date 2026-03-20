import React from 'react'

import { ModalProvider, ModalRoot } from '@/components/Modals'

import { HeaderThemeProvider } from './HeaderTheme'
import { ThemeProvider } from './Theme'

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <ThemeProvider>
      <HeaderThemeProvider>
        <ModalProvider>
          {children}
          <ModalRoot />
        </ModalProvider>
      </HeaderThemeProvider>
    </ThemeProvider>
  )
}

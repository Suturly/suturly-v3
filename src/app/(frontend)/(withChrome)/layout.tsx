import React from 'react'

import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'

export default function WithChromeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <div aria-hidden className="site-header-spacer" />
      {children}
      <Footer />
    </>
  )
}

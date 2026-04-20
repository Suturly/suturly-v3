import { MarketingSiteFooter } from '@/components/marketing/MarketingSiteFooter'
import { MarketingSiteHeader } from '@/components/marketing/MarketingSiteHeader'
import React from 'react'

import '../product.css'
import '../website.css'

export default function AboutMarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="marketing-site">
      <MarketingSiteHeader />
      <main className="marketing-site__main">{children}</main>
      <MarketingSiteFooter />
    </div>
  )
}

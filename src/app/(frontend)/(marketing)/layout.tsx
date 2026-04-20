import { MarketingSiteFooter } from '@/components/marketing/MarketingSiteFooter'
import { MarketingSiteHeader } from '@/components/marketing/MarketingSiteHeader'
import React from 'react'

import '../../../components/marketing/marketing-swiper.css'
import '../product.css'
import '../website.css'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="marketing-site">
      <MarketingSiteHeader />
      <main className="marketing-site__main">{children}</main>
      <MarketingSiteFooter />
    </div>
  )
}

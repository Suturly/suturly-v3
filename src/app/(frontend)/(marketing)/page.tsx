import {
  /** 1 */ HomeHeroSection,
  /** 2 */ HomeProblemSection,
  /** 3 */ HomePlatformSection,
  /** 4 */ HomeContentTrustSection,
  /** 5 */ HomeSpecialtySection,
  /** 6 */ HomeThreeStepsSection,
  /** 7 */ HomeThreeLayersSection,
  /** 8 */ HomePrivacySection,
  /** 9 */ HomeEvidenceSection,
} from '@/components/marketing/home/home'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { getServerSideURL } from '@/utilities/getURL'
import type { Metadata } from 'next'

const title = 'Suturly: Procedure-specific patient guidance, delivered step-by-step'
const description =
  'Suturly delivers procedure-specific education to surgical patients via timed SMS nudges and web guides: from pre-op through recovery. No app, no login, no generic handouts.'

export const metadata: Metadata = {
  title,
  description,
  openGraph: mergeOpenGraph({
    title,
    description,
    url: getServerSideURL(),
  }),
}

export default function HomeMarketingPage() {
  return (
    <>
      <HomeHeroSection />
      <HomeProblemSection />
      <HomePlatformSection />
      <HomeContentTrustSection />
      <HomeSpecialtySection />
      <HomeThreeStepsSection />
      <HomeThreeLayersSection />
      <HomePrivacySection />
      <HomeEvidenceSection />
    </>
  )
}

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

const title = 'Suturly — Evidence-based medical resources'
const description =
  'Explore structured medical resources with readable summaries, consistent citations, and topics built for clinicians and patients.'

export const metadata: Metadata = {
  title,
  description,
  openGraph: mergeOpenGraph({
    title,
    description,
    url: `${getServerSideURL()}/home`,
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

import { HomeHeroSection } from '@/components/marketing/home/HomeHeroSection'
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
  return <HomeHeroSection />
}

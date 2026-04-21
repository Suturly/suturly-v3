import { AboutTeamSection } from '@/components/marketing/about/AboutTeamSection'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { getServerSideURL } from '@/utilities/getURL'
import type { Metadata } from 'next'

const title = 'About: Suturly'
const description = 'Meet the team behind evidence-based medical resources.'

export const metadata: Metadata = {
  title,
  description,
  openGraph: mergeOpenGraph({
    title,
    description,
    url: `${getServerSideURL()}/about`,
  }),
}

export default function AboutMarketingPage() {
  return (
    <>
      <section className="marketing-about-intro" aria-labelledby="marketing-about-intro-heading">
        <div className="section section--pad-lg">
          <div className="container">
            <div className="row">
              <div className="col col-xs-12 col-lg-8">
                <p className="eyebrow fg-primary">About</p>
                <h1 id="marketing-about-intro-heading" className="h1 fg-primary u-mt-1">
                  Our mission
                </h1>
                <p className="paragraph fg-body u-mt-1 measure-readable">
                  Add your about copy here. Team profiles below are shown in three columns on
                  larger screens and stack on small devices.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <AboutTeamSection />
    </>
  )
}

import { Button } from '@/components/ui/button'
import Image from 'next/image'
import Link from 'next/link'

/** First marketing section; align with Figma node 66:4370 when available. */
export function HomeHeroSection() {
  return (
    <section className="marketing-home-hero" aria-labelledby="marketing-home-hero-heading">
      <div className="marketing-home-hero__bg" aria-hidden>
        <div className="marketing-home-hero__blob marketing-home-hero__blob--tr" />
        <div className="marketing-home-hero__blob marketing-home-hero__blob--bl" />
      </div>

      <div className="section section--pad-lg">
        <div className="container">
          <div className="row">
            <div className="col col-md-12 col-lg-7">
              <div className="marketing-home-hero__intro">
                <h1 id="marketing-home-hero-heading" className="h1 fg-primary u-mt-1">
                Every patient, actually prepared for procedure
                </h1>
                <p className="paragraph fg-body u-mt-1-25 measure-readable">
                Text-based perioperative education that meets patients where they are. No app, no login—just better prep and real outcomes.
                </p>
              </div>
            </div>
            <div className="col col-md-12 col-lg-5">
              <div className="marketing-home-hero__img-wrap">
                <Image
                  src="/images/home/hero-img.png"
                  alt="Patient-friendly perioperative education on a device"
                  fill
                  sizes="(min-width: 64rem) 50vw, 100vw"
                  className="marketing-home-hero__img"
                  priority
                />
              </div>
            </div>
          </div>

          <div className="row u-mt-3">
            <div className="col col-xs-12 col-lg-12">
              <div id="how-it-works" className="marketing-home-hero__placeholder">
                <p className="p-sm fg-body">
                  Placeholder for the rest of the Figma frame; remove when you add real sections.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

import Image from 'next/image'

import { PlatformAdditionalFeaturesCarousel } from '@/components/marketing/home/PlatformAdditionalFeaturesCarousel'
import { PlatformSectionTabs } from '@/components/marketing/home/PlatformSectionTabs'

/** First marketing section; align with Figma node 66:4370 when available. */
export function HomeHeroSection() {
  return (
    <section className="section section--pad-lg">
      <div className="container">
        <div className="row">
          <div className="col col-lg-12">
            <div className="hero-cont-grid">
              <h1 id="marketing-home-hero-heading" className="hero-h u-color-primary-400">
                Every <span className="u-color-primary-600">patient</span>,{' '}
                <span className="u-color-primary-600">guided</span> through every step
              </h1>
              <p className="hero-p u-color-primary-600">
                Procedure-specific education delivered in timed steps from pre-op through recovery —
                not all at once in a single clinic visit.
              </p>
              <div className="marketing-home-hero-key__img-wrap">
                <Image
                  src="/images/home/hero-phone.png"
                  alt="hand with a phone"
                  fill
                  sizes="537px, 766px"
                  className="marketing-home-hero__img"
                  priority
                />
              </div>
              <div className="marketing-home-hero-additional__img-wrap">
                <Image
                  src="/images/home/hero-papers.png"
                  alt="old papers"
                  fill
                  sizes="314px, 460px"
                  className="marketing-home-hero__img"
                  priority
                />
              </div>
              <div className="hero-stat-box">
                <p className="h5 hero-stat-box__title">98%</p>
                <p className="hero-stat-box__text">SMS open rate vs. 20% for email</p>
              </div>
              <div className="hero-stat-box">
                <p className="h5 hero-stat-box__title">97%</p>
                <p className="hero-stat-box__text">of US adults can receive text messages</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
export function HomeProblemSection() {
  return (
    <section className="section">
      <div className="container">
        <div className="row">
          <div className="col col-lg-8 col-md-12">
            <div className="problem-cont-block u-bg-gray-900 u-color-primary-50">
              <h2 className="h3 problem-cont-block__title">
                <span className="u-opacity-40">Surgical patients are</span> under-prepared <span className="u-opacity-40">and</span> under-guided
              </h2>
              <p className="problem-cont-block__text">
                Patients get minutes to understand complex procedures, then leave with paper handouts they can barely retain. Recovery guidance is generic, fragmented, and disconnected from their actual surgery. And when they search for answers on their own, <a href="https://suturly-v3.vercel.app/" target="_blank" rel="noopener noreferrer">misinformation fills the gap</a>.
              </p>
            </div>
          </div>
          <div className="col col-lg-4 col-md-12">
            <div className="problem-cont-block__stats-wrap">
              <div className="problem-cont-block__stats-item">
                <p className="h3 u-color-primary-1000">
                  98%
                </p>
                <p className="u-color-gray-500">
                  SMS open rate vs. 20% for email
                </p>
              </div>
              <div className="problem-cont-block__stats-item">
                <p className="h3 u-color-primary-1000">
                  97%
                </p>
                <p className="u-color-gray-500">
                  of US adults can receive text messages
                </p>
              </div>
              <div className="problem-cont-block__stats-item">
                <p className="h3 u-color-primary-1000">
                  97%
                </p>
                <p className="u-color-gray-500">
                  of US adults can receive text messages
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
export function HomePlatformSection() {
  return (
    <section id="platform" className="section section--pad-lg">
      <div className="container">
        <div className="row">
          <div className="col col-lg-3 u-lg-only" />
          <div className="col col-lg-6">
            <div className="platform-main-title">
              <h2 className="h2 u-color-primary-400 u-ta-center">One platform. <br /> <span className="u-color-primary-600">Every role in the surgical journey.</span></h2>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col col-lg-12">
            <div className="platform-section">
              <PlatformSectionTabs />
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col col-xs-12">
            <PlatformAdditionalFeaturesCarousel />
          </div>
        </div>
      </div>
    </section>
  )
}

/** "Content worth trusting" — styling in website.css / globals.css. */
export function HomeContentTrustSection() {
  return (
    <section
      className="section section--pad-lg marketing-home-trust"
      aria-labelledby="marketing-home-content-trust-heading"
    >
      <div className="container">
        <div className="row">
          <div className="col col-lg-12">
            <header className="marketing-home-trust__head">
              <h2 id="marketing-home-content-trust-heading" className="marketing-home-trust__title">
                <span className="u-opacity-40">Not a PDF. Not a chatbot. </span>
                Content worth trusting.
              </h2>
            </header>

            <div className="col col-lg-12">
              <div className="trust-blocks-wrap">
                <article className="trust-block">
                  <h3 className="h6 trust-block__title">Guideline-sourced</h3>
                  <p className="trust-block__text u-opacity-60">
                    Built from ACS, MBSAQIP, and procedure-specific evidence. Not scraped. Not generated.
                    Authored.
                  </p>
                </article>

                <article className="trust-block">
                  <h3 className="h6 trust-block__title">Physician-verified</h3>
                  <p className="trust-block__text u-opacity-60">
                    Every module is surgeon-reviewed for clinical accuracy and real-world relevance before
                    patient use.
                  </p>
                </article>

                <article className="trust-block">
                  <h3 className="h6 trust-block__title">Patient-readable</h3>
                  <p className="trust-block__text u-opacity-60">
                    Plain language. Visual-first. Tested for comprehension. Multi-language. Designed to be
                    actually read.
                  </p>
                </article>

                <article className="trust-block">
                  <h3 className="h6 trust-block__title">Outcomes-refined</h3>
                  <p className="trust-block__text u-opacity-60">
                    PRO scores and completion data drive every revision. Content that underperforms gets
                    rewritten.
                  </p>
                </article>
              </div>
            </div>
          </div>
        </div>

        <div className="marketing-home-trust__visual-wrap">
          <img
            className="marketing-home-trust__visual"
            src="/images/home/pages-visual.png"
            alt="trust visual"
            aria-label="Product illustration placeholder"
          />
        </div>
      </div>
    </section>
  )
}

export { HomeSpecialtySection } from './HomeSpecialtySection'

/** “Three steps” — grid: 12 / 6 / 3 cols (mobile / tablet / desktop). Styles in website.css. */
export function HomeThreeStepsSection() {
  return (
    <section
      id="how-it-works"
      className="section marketing-home-steps"
      aria-labelledby="marketing-home-steps-heading"
    >
      <div className="container">
        <div className="row">
          <div className="col col-xs-12 col-md-6 col-lg-3">
            <article className="marketing-home-steps__card marketing-home-steps__card--lead">
              <h2 id="marketing-home-steps-heading" className="h3 marketing-home-steps__lead-title">
                Three steps <span className="u-opacity-60">No app No login No barriers</span>
              </h2>
            </article>
          </div>

          <div className="col col-xs-12 col-md-6 col-lg-3">
            <article className="marketing-home-steps__card marketing-home-steps__card--step">
              <p className="marketing-home-steps__step-index" aria-hidden="true">
                1
              </p>
              <h3 className="h6 color-primary-1000 marketing-home-steps__step-title">Enroll</h3>
              <p className="marketing-home-steps__step-text u-opacity-60">
                One click in the EHR activates a procedure-specific pathway matched to procedure date
                and language.
              </p>
            </article>
          </div>

          <div className="col col-xs-12 col-md-6 col-lg-3">
            <article className="marketing-home-steps__card marketing-home-steps__card--step">
              <p className="marketing-home-steps__step-index" aria-hidden="true">
                2
              </p>
              <h3 className="h6 color-primary-1000 marketing-home-steps__step-title">Engage</h3>
              <p className="marketing-home-steps__step-text u-opacity-60">
                Patients receive timed texts linking to web guides, checklists, and surveys. No app. No
                login.
              </p>
            </article>
          </div>

          <div className="col col-xs-12 col-md-6 col-lg-3">
            <article className="marketing-home-steps__card marketing-home-steps__card--step">
              <p className="marketing-home-steps__step-index" aria-hidden="true">
                3
              </p>
              <h3 className="h6 color-primary-1000 marketing-home-steps__step-title">Measure</h3>
              <p className="marketing-home-steps__step-text u-opacity-60">
                Completion rates, PRO scores, and complication alerts surface in a clinician dashboard
                in real time.
              </p>
            </article>
          </div>
        </div>
      </div>
    </section>
  )
}

/** Privacy architecture — left: heading + 2×2 feature grid; right: visual placeholder. */
export function HomePrivacySection() {
  return (
    <section
      id="security"
      className="section section--pad-lg marketing-home-privacy"
      aria-labelledby="marketing-home-privacy-heading"
    >
      <div className="container">
        <div className="row marketing-home-privacy__row">
          <div className="col col-sm-12 col-lg-8">
            <h2 id="marketing-home-privacy-heading" className="h3 u-color-primary-50 marketing-home-privacy__title">
                Architected for privacy <span className="u-opacity-40">from the ground up</span>
            </h2>

            <div className="row u-color-primary-50 marketing-home-privacy__grid">
              <div className="col col-sm-12 col-lg-4 for-privacy-item">
                <article className="marketing-home-privacy__item">
                  <div className="marketing-home-privacy__item-icon-wrap">
                  <span className="marketing-home-privacy__item-icon" aria-hidden />
                  <h3 className="h6 u-color-primary-50 marketing-home-privacy__item-title">PHI-Free SMS</h3>
                  </div>
                  <p className="u-opacity-60 marketing-home-privacy__item-text">
                    Text messages contain no PHI. Only prompts, reminders, and secure links—never
                    patient names.
                  </p>
                </article>
              </div>
              <div className="col col-xs-12 col-md-6 for-privacy-item">
                <article className="marketing-home-privacy__item">
                  <div className="marketing-home-privacy__item-icon-wrap">
                  <span className="marketing-home-privacy__item-icon" aria-hidden />
                  <h3 className="h6 u-color-primary-50 marketing-home-privacy__item-title">Tokenized Access</h3>
                  </div>
                  <p className="u-opacity-60 marketing-home-privacy__item-text">
                    Unique, time-limited URLs. No account creation, no login, no passwords. One tap from
                    text to guide.
                  </p>
                </article>
              </div>
              <div className="col col-xs-12 col-md-6 for-privacy-item">
                <article className="marketing-home-privacy__item">
                  <div className="marketing-home-privacy__item-icon-wrap">
                  <span className="marketing-home-privacy__item-icon" aria-hidden />  
                  <h3 className="h6 u-color-primary-50 marketing-home-privacy__item-title">HIPAA-Ready</h3>
                  </div>
                  <p className="u-opacity-60 marketing-home-privacy__item-text">
                    Encrypted data at rest and in transit. BAA-compatible AWS hosting. Three-tier Epic
                    integration roadmap.
                  </p>
                </article>
              </div>
              <div className="col col-xs-12 col-md-6 for-privacy-item">
                <article className="marketing-home-privacy__item">
                  <div className="marketing-home-privacy__item-icon-wrap">
                  <span className="marketing-home-privacy__item-icon" aria-hidden />
                  <h3 className="h6 u-color-primary-50 marketing-home-privacy__item-title">IRB-Compatible</h3>
                  </div>
                  <p className="u-opacity-60 marketing-home-privacy__item-text">
                    
                    Built for clinical research from day one. Serves both clinical care and IRB-approved
                    studies without retrofitting.
                  </p>
                </article>
              </div>
            </div>
          </div>

          <div className="col col-xs-12 col-lg-4">
            <Image
              src="/images/home/shield.png"
              alt="Privacy and security illustration"
              className="marketing-home-privacy__visual"
              width={400}
              height={400}
              priority
            />
                </div>
        </div>
      </div>
    </section>
  )
}

export { HomeEvidenceSection } from './HomeEvidenceSection'
export { HomeThreeLayersSection } from './HomeThreeLayersSection'

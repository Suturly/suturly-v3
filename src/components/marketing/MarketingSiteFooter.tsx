import Image from 'next/image'
import { Mail } from 'lucide-react'

import { PartnerContactOpenButton } from '@/components/marketing/partnerContactModal'
import { Button } from '@/components/ui/button'

export function MarketingSiteFooter() {
  return (
    <footer className="marketing-site-footer">
      <div
        className="section marketing-site-footer__partner"
        aria-labelledby="marketing-site-footer-partner-heading"
      >
        <div className="container">
          <div className="row">
            <div className="col col-xs-12">
              <div className="marketing-site-footer__partner-card">
                <div className="marketing-site-footer__partner-brand" aria-hidden>
                  <Image
                    src="/images/home/logomark.svg"
                    alt=""
                    width={56}
                    height={56}
                    className="marketing-site-footer__partner-logo"
                  />
                </div>
                <div className="marketing-site-footer__partner-content">
                  <h2
                    id="marketing-site-footer-partner-heading"
                    className="h2 u-color-primary-400 marketing-site-footer__partner-title"
                  >
                    Partner with <span className="u-color-primary-600">Suturly</span>
                  </h2>

                  <p className="u-color-primary-600 marketing-site-footer__partner-lead">
                    We&apos;re actively seeking clinical and research collaborators to pilot, refine, and expand
                    evidence-based perioperative education. If you&apos;re exploring better ways to prepare
                    patients — let&apos;s work on it together.
                  </p>
                </div>
                <div className="marketing-site-footer__partner-actions">
                  <Button
                    variant="secondary"
                    className="marketing-site-footer__partner-email"
                    href="mailto:hello@suturly.com"
                    iconLeft={<Mail aria-hidden className="marketing-site-footer__partner-email-icon" />}
                  >
                    hello@suturly.com
                  </Button>

                  <PartnerContactOpenButton className="marketing-site-footer__partner-button">
                    Get in touch
                  </PartnerContactOpenButton>
                </div>
              </div>

              <p className="text-caption-p u-color-gray-100 marketing-site-footer__partner-copyright">
                © {new Date().getFullYear()} Suturly Tech Corp. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

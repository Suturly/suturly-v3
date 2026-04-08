import Link from 'next/link'

export function MarketingSiteFooter() {
  return (
    <footer className="marketing-site-footer">
      <div className="section">
        <div className="container">
          <div className="row">
            <div className="col col-xs-12 col-lg-12">
              <div className="marketing-site-footer__inner">
                <p className="marketing-site-footer__note">
                  © {new Date().getFullYear()} Suturly. Evidence-based medical resources.
                </p>
                <nav className="marketing-site-footer__nav" aria-label="Footer">
                  <Link className="marketing-site-footer__link" href="/resources">
                    Resources
                  </Link>
                  <Link className="marketing-site-footer__link" href="/admin">
                    Admin
                  </Link>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

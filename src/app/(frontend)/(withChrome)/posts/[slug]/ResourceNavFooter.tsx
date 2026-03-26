import React from 'react'

export type FooterLink =
  | { label: string; href: string }
  | { label: string; onClick: () => void }

type ResourceNavFooterProps = {
  links?: FooterLink[]
}

const defaultLinks: FooterLink[] = [{ href: '#', label: 'Doctor contacts' }]

export const ResourceNavFooter: React.FC<ResourceNavFooterProps> = ({ links = defaultLinks }) => {
  return (
    <div className="resource-nav__footer">
      <div className="resource-nav__footer-links">
        {links.map((link) =>
          'onClick' in link ? (
            <button
              className="resource-nav__footer-link"
              key={link.label}
              onClick={link.onClick}
              type="button"
            >
              {link.label}
            </button>
          ) : (
            <a className="resource-nav__footer-link" href={link.href} key={link.label}>
              {link.label}
            </a>
          ),
        )}
      </div>
    </div>
  )
}

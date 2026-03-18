import React from 'react'

type FooterLink = {
  href: string
  label: string
}

type ResourceNavFooterProps = {
  links?: FooterLink[]
}

const defaultLinks: FooterLink[] = [
  { href: '#', label: 'Doctor contacts' },
  { href: '#', label: 'Questions to doctor' },
]

export const ResourceNavFooter: React.FC<ResourceNavFooterProps> = ({ links = defaultLinks }) => {
  return (
    <div className="resource-nav__footer">
      <div className="resource-nav__footer-links">
        {links.map((link) => (
          <a className="resource-nav__footer-link" href={link.href} key={link.label}>
            {link.label}
          </a>
        ))}
      </div>
    </div>
  )
}

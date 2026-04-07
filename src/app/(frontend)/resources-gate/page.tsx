import type { Metadata } from 'next'

import { Logo } from '@/components/Logo/Logo'

import { ResourcesGateForm } from './ResourcesGateForm'

export const metadata: Metadata = {
  title: 'Resources access',
  robots: { index: false, follow: false },
}

type Props = {
  searchParams: Promise<{ next?: string }>
}

export default async function ResourcesGatePage({ searchParams }: Props) {
  const { next: nextRaw } = await searchParams
  const defaultNext =
    typeof nextRaw === 'string' && nextRaw.startsWith('/') && !nextRaw.startsWith('//') ? nextRaw : '/resources'

  return (
    <main className="resource-gate-page">
      <div className="resource-gate-page__split">
        <aside aria-label="Suturly" className="resource-gate-page__brand">
          <div className="resource-gate-page__brand-inner">
            <Logo className="resource-gate-page__logo" loading="eager" priority="high" />
            <h4 className="resource-gate-page__tagline">Evidence-based medical resources</h4>
          </div>
        </aside>

        <div className="resource-gate-page__form-column">
          <div className="resource-gate-page__form-inner">
            <h1 className="resource-gate-page__title">Resources access</h1>

            <ResourcesGateForm defaultNext={defaultNext} />
          </div>
        </div>
      </div>
    </main>
  )
}

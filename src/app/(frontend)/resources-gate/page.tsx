import type { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  title: 'Resources access',
  robots: { index: false, follow: false },
}

type Props = {
  searchParams: Promise<{ next?: string; error?: string }>
}

export default async function ResourcesGatePage({ searchParams }: Props) {
  const { next: nextRaw, error } = await searchParams
  const next = typeof nextRaw === 'string' && nextRaw.startsWith('/') && !nextRaw.startsWith('//') ? nextRaw : '/resources'

  return (
    <main className="container py-16">
      <div className="resource-gate mx-auto max-w-md rounded-lg border border-[var(--primary-100)] bg-[var(--background)] p-8 shadow-sm">
        <h1
          className="mb-2 font-semibold text-[var(--primary-600)]"
          style={{ fontSize: 'var(--text-h4)', lineHeight: 'var(--text-h4--line-height)' }}
        >
          Resources
        </h1>
        <p className="mb-6 text-[var(--gray-500)]" style={{ fontSize: 'var(--text-p-main)', lineHeight: 'var(--text-p-main--line-height)' }}>
          Enter the password to view this section.
        </p>
        {error ? (
          <p
            className="mb-4 text-[var(--destructive)]"
            role="alert"
            style={{ fontSize: 'var(--text-p-sm)', lineHeight: 'var(--text-p-sm--line-height)' }}
          >
            Incorrect password. Try again.
          </p>
        ) : null}
        <form action="/api/resources-gate" className="flex flex-col gap-4" method="post">
          <input name="next" type="hidden" value={next} />
          <label className="flex flex-col gap-1">
            <span className="text-p-sm font-medium text-[var(--gray-500)]">Password</span>
            <input
              autoComplete="current-password"
              className="rounded-md border border-[var(--primary-100)] bg-[var(--background)] px-3 py-2 text-p-main text-[var(--gray-900)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-600)]"
              name="password"
              required
              type="password"
            />
          </label>
          <button
            className="rounded-md bg-[var(--primary-600)] px-4 py-2 text-p-main font-semibold text-[var(--background)] hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-600)] focus-visible:ring-offset-2"
            type="submit"
          >
            Continue
          </button>
        </form>
      </div>
    </main>
  )
}

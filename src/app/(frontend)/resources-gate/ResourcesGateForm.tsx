'use client'

import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

function safeClientNext(next: string): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return '/resources'
  }
  return next
}

type Props = {
  defaultNext: string
}

export function ResourcesGateForm({ defaultNext }: Props) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const errorId = 'resource-gate-password-error'
  const showError = Boolean(fieldError)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFieldError(null)
    setPending(true)
    try {
      const res = await fetch('/api/resources-gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ password, next: defaultNext }),
      })

      let data: { ok?: boolean; next?: string; error?: string } = {}
      try {
        data = (await res.json()) as typeof data
      } catch {
        setFieldError('Something went wrong. Try again.')
        return
      }

      if (res.ok && data.ok === true && typeof data.next === 'string') {
        router.replace(safeClientNext(data.next))
        return
      }

      if (res.status === 401 || data.error === 'invalid_password') {
        setFieldError('Incorrect password. Try again.')
        return
      }

      setFieldError('Something went wrong. Try again.')
    } catch {
      setFieldError('Something went wrong. Try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <form aria-busy={pending} className="resource-gate-page__form" onSubmit={onSubmit}>
      <label className="resource-gate-page__label" htmlFor="resource-gate-password">
        Password
      </label>
      <input
        aria-describedby={showError ? errorId : undefined}
        aria-invalid={showError}
        autoComplete="current-password"
        className="resource-gate-page__input"
        disabled={pending}
        id="resource-gate-password"
        name="password"
        onChange={(e) => {
          setPassword(e.target.value)
          if (fieldError) setFieldError(null)
        }}
        required
        type="password"
        value={password}
      />
      {showError ? (
        <p className="resource-gate-page__field-error" id={errorId} role="alert">
          {fieldError}
        </p>
      ) : null}
      <button className="resource-gate-page__submit" disabled={pending} type="submit">
        {pending ? 'Signing in…' : 'Continue'}
      </button>
    </form>
  )
}

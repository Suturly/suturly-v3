'use client'

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'

import type { ModalApi, OpenModalConfig } from '@/components/Modals'
import { useModal } from '@/components/Modals'
import { Button, type ButtonProps } from '@/components/ui/button'
import { getClientSideURL } from '@/utilities/getURL'

const FORM_ID = 'partner-contact-form'

function parsePartnerFormIdFromEnv(): number | null {
  const raw = process.env.NEXT_PUBLIC_PARTNER_CONTACT_FORM_ID
  if (raw === undefined || raw === '') return null
  const n = Number.parseInt(raw, 10)
  return Number.isFinite(n) ? n : null
}

let partnerFormIdPromise: Promise<number | null> | null = null

function getPartnerContactFormId(): Promise<number | null> {
  const envId = parsePartnerFormIdFromEnv()
  if (envId !== null) return Promise.resolve(envId)

  if (!partnerFormIdPromise) {
    partnerFormIdPromise = fetch(`${getClientSideURL()}/api/globals/marketing`)
      .then(async (res) => {
        if (!res.ok) return null
        const data = (await res.json()) as { partnerContactForm?: number | { id: number } | null }
        const raw = data.partnerContactForm
        if (typeof raw === 'number') return raw
        if (raw && typeof raw === 'object' && 'id' in raw) return raw.id
        return null
      })
      .catch(() => null)
  }

  return partnerFormIdPromise
}

function PartnerContactFormContent({ api }: { api: ModalApi }) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [configLoading, setConfigLoading] = useState(true)
  const [resolvedFormId, setResolvedFormId] = useState<number | null>(null)
  const submitLock = useRef(false)

  useEffect(() => {
    if (parsePartnerFormIdFromEnv() !== null) {
      setResolvedFormId(parsePartnerFormIdFromEnv())
      setConfigLoading(false)
      return
    }
    let cancelled = false
    void getPartnerContactFormId().then((id) => {
      if (!cancelled) {
        setResolvedFormId(id)
        setConfigLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const onSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      if (submitLock.current) return

      const formId = resolvedFormId ?? (await getPartnerContactFormId())
      if (formId === null) {
        setError(
          'Form is not configured. In Payload Admin, open Globals → Marketing and choose “Partner contact form”, or run seed.',
        )
        return
      }

      const form = e.currentTarget
      const fd = new FormData(form)
      const submissionData = [
        { field: 'name', value: String(fd.get('name') ?? '') },
        { field: 'email', value: String(fd.get('email') ?? '') },
        { field: 'message', value: String(fd.get('message') ?? '') },
      ]

      setError(null)
      submitLock.current = true
      setSubmitting(true)

      try {
        const req = await fetch(`${getClientSideURL()}/api/form-submissions`, {
          body: JSON.stringify({
            form: formId,
            submissionData,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
        })

        let body: { errors?: { message?: string }[] } = {}
        try {
          body = (await req.json()) as typeof body
        } catch {
          // non-JSON error response
        }

        if (req.status >= 400) {
          setError(body.errors?.[0]?.message || 'Something went wrong. Please try again.')
          return
        }

        form.reset()
        api.closeModal()
      } catch {
        setError('Something went wrong. Please try again.')
      } finally {
        submitLock.current = false
        setSubmitting(false)
      }
    },
    [api, resolvedFormId],
  )

  return (
    <form
      id={FORM_ID}
      aria-busy={submitting}
      className="partner-contact-modal__form partner-contact-modal__form--marketing"
      onSubmit={onSubmit}
    >
      {error ? (
        <p className="partner-contact-modal__status partner-contact-modal__status--error" role="alert">
          {error}
        </p>
      ) : null}
      {!configLoading && resolvedFormId === null && !parsePartnerFormIdFromEnv() ? (
        <p className="partner-contact-modal__status partner-contact-modal__status--error" role="alert">
          No partner contact form is linked. In Payload Admin: Globals → Marketing → Partner contact form.
        </p>
      ) : null}
      {submitting ? (
        <p className="partner-contact-modal__status partner-contact-modal__status--muted">Sending…</p>
      ) : null}
      <div className="partner-contact-modal__field">
        <label className="partner-contact-modal__label" htmlFor="partner-contact-name">
          Name
        </label>
        <input
          id="partner-contact-name"
          autoComplete="name"
          className="partner-contact-modal__input"
          disabled={submitting}
          name="name"
          required
          type="text"
        />
      </div>
      <div className="partner-contact-modal__field">
        <label className="partner-contact-modal__label" htmlFor="partner-contact-email">
          Email
        </label>
        <input
          id="partner-contact-email"
          autoComplete="email"
          className="partner-contact-modal__input"
          disabled={submitting}
          name="email"
          required
          type="email"
        />
      </div>
      <div className="partner-contact-modal__field">
        <label className="partner-contact-modal__label" htmlFor="partner-contact-message">
          Message
        </label>
        <textarea
          id="partner-contact-message"
          className="partner-contact-modal__textarea"
          disabled={submitting}
          name="message"
          required
          rows={4}
        />
      </div>
    </form>
  )
}

/**
 * Global “Get in touch” modal.
 *
 * From **server** components, use `PartnerContactOpenButton` (tiny client leaf).
 *
 * From **client** components, use `usePartnerContactModal()` and `onClick={openPartnerContact}`.
 *
 * Or with `useModal` directly:
 *
 * ```tsx
 * const { openModal } = useModal()
 * openModal(partnerContactModalConfig)
 * ```
 */
export const partnerContactModalConfig: OpenModalConfig = {
  id: 'partner-contact',
  variant: 'marketing',
  initialScreenKey: 'form',
  screens: {
    form: {
      title: 'Get in touch',
      content: (api: ModalApi) => <PartnerContactFormContent api={api} />,
      actions: [
        {
          label: 'Submit',
          onClick: () => {
            const form = document.getElementById(FORM_ID) as HTMLFormElement | null
            form?.requestSubmit()
          },
        },
      ],
    },
  },
}

export function usePartnerContactModal() {
  const { openModal } = useModal()
  return useCallback(() => {
    openModal(partnerContactModalConfig)
  }, [openModal])
}

/** Use from server components (smallest client leaf). For client components, `usePartnerContactModal` + `onClick` is fine too. */
export function PartnerContactOpenButton(props: Omit<ButtonProps, 'href' | 'asChild'>) {
  const openPartnerContact = usePartnerContactModal()
  return <Button {...props} type="button" onClick={openPartnerContact} />
}

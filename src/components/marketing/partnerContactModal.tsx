'use client'

import { useCallback } from 'react'

import type { ModalApi, OpenModalConfig } from '@/components/Modals'
import { useModal } from '@/components/Modals'
import { Button, type ButtonProps } from '@/components/ui/button'

const FORM_ID = 'partner-contact-form'

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
  initialScreenKey: 'form',
  screens: {
    form: {
      title: 'Get in touch',
      content: (api: ModalApi) => (
        <form
          id={FORM_ID}
          className="partner-contact-modal__form"
          onSubmit={(e) => {
            e.preventDefault()
            // TODO: POST FormData to your API / server action
            api.closeModal()
          }}
        >
          <div className="partner-contact-modal__field">
            <label className="partner-contact-modal__label" htmlFor="partner-contact-name">
              Name
            </label>
            <input
              id="partner-contact-name"
              autoComplete="name"
              className="partner-contact-modal__input"
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
              name="message"
              required
              rows={4}
            />
          </div>
        </form>
      ),
      actions: [
        { label: 'Cancel', variant: 'outline', closeOnClick: true },
        {
          label: 'Send message',
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

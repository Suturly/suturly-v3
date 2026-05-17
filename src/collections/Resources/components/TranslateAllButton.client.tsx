'use client'

import { Button, toast, useConfig, useDocumentInfo } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import { useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * Resources collection: mounted via `admin.components.edit.beforeDocumentControls`.
 * Portaled into `.doc-controls__controls` immediately **before** `#live-preview-toggler` when present,
 * otherwise **before** `#preview-button`. Matches fallback DOM order (Translate renders ahead of Live Preview).
 *
 * POST `/api/posts/:id/translate-to-es` — see translateResourceEndpoint.
 */
export const TranslateAllButton = () => {
  const { collectionSlug } = useDocumentInfo()
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null)
  const [inlineFallback, setInlineFallback] = useState(false)

  useLayoutEffect(() => {
    if (collectionSlug !== 'posts') {
      setPortalEl(null)
      setInlineFallback(true)
      return
    }

    let cancelled = false
    let slot: HTMLSpanElement | null = null
    let fallbackTimer: ReturnType<typeof setTimeout> | undefined

    const cleanupSlot = () => {
      slot?.remove()
      slot = null
      if (!cancelled) setPortalEl(null)
    }

    const attachTranslateSlot = (): boolean => {
      const controls = document.querySelector('.doc-controls__controls')
      if (!controls) return false

      /** Prefer anchoring before Live Preview so order is Translate → Live preview → Preview */
      const livePreview = controls.querySelector<HTMLElement>('#live-preview-toggler')
      const preview = controls.querySelector<HTMLElement>('#preview-button')
      const anchor = livePreview ?? preview
      if (!anchor || anchor.parentElement !== controls) return false

      if (!slot) {
        slot = document.createElement('span')
        slot.className = 'resources-translate-all-slot'
      }
      controls.insertBefore(slot, anchor)
      if (!cancelled) {
        setPortalEl(slot)
        setInlineFallback(false)
      }
      return true
    }

    const armFallbackTimer = () => {
      if (fallbackTimer !== undefined) clearTimeout(fallbackTimer)
      fallbackTimer = setTimeout(() => {
        if (!cancelled && !slot) setInlineFallback(true)
      }, 600)
    }

    if (attachTranslateSlot()) {
      return () => {
        cancelled = true
        if (fallbackTimer !== undefined) clearTimeout(fallbackTimer)
        cleanupSlot()
      }
    }

    const controls = document.querySelector('.doc-controls__controls')
    if (!controls) {
      setInlineFallback(true)
      return () => {
        cancelled = true
        if (fallbackTimer !== undefined) clearTimeout(fallbackTimer)
        cleanupSlot()
      }
    }

    armFallbackTimer()

    const mo = new MutationObserver(() => {
      if (!cancelled && attachTranslateSlot()) {
        mo.disconnect()
        if (fallbackTimer !== undefined) clearTimeout(fallbackTimer)
      }
    })
    mo.observe(controls, { childList: true, subtree: true })

    const timeoutId = window.setTimeout(() => {
      mo.disconnect()
    }, 12_000)

    return () => {
      cancelled = true
      mo.disconnect()
      window.clearTimeout(timeoutId)
      if (fallbackTimer !== undefined) clearTimeout(fallbackTimer)
      cleanupSlot()
    }
  }, [collectionSlug])

  const chrome = <TranslateAllChrome />

  if (portalEl && collectionSlug === 'posts') {
    return createPortal(chrome, portalEl)
  }

  if (inlineFallback || collectionSlug !== 'posts') {
    return chrome
  }

  return null
}

const TranslateAllChrome = () => {
  const { id } = useDocumentInfo()
  const { config } = useConfig()
  const apiRoute = config?.routes?.api ?? '/api'
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const confirmModalSlug = 'translate-all-confirm'

  const resolver = (config?.admin?.custom as { translator?: { resolver?: { key: string } } } | undefined)
    ?.translator?.resolver

  if (!id) {
    return null
  }

  if (!resolver) {
    return null
  }

  const runTranslate = async () => {
    setPending(true)
    try {
      // Same-origin URL only — admin may live on www while SERVER_URL/env still points at *.vercel.app,
      // which would omit auth cookies and yield 401 ("You must be logged in to translate.").
      const url = `${apiRoute}/posts/${encodeURIComponent(String(id))}/translate-to-es`
      const res = await fetch(url, {
        method: 'POST',
        credentials: 'include',
      })

      const body = (await res.json().catch(() => null)) as {
        success?: boolean
        message?: string
      } | null

      if (!res.ok || !body?.success) {
        toast.error(body?.message ?? `Translation failed (HTTP ${res.status}).`)
        return
      }

      toast.success('Translated to Spanish. Switch to the ES locale to review.')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Translation failed.')
    } finally {
      setPending(false)
    }
  }

  const buttonTitle =
    'Overwrite every localized text field from English via DeepL and stamp Last translated at.'

  return (
    <>
      <button
        type="button"
        id="translate-all-to-es-button"
        className="resources-translate-all-btn"
        disabled={pending}
        title={buttonTitle}
        onClick={() => setConfirmOpen(true)}
      >
        {pending ? 'Translating…' : 'Translate all to ES'}
      </button>

      {confirmOpen ? (
        <ConfirmDialog
          slug={confirmModalSlug}
          pending={pending}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={async () => {
            setConfirmOpen(false)
            await runTranslate()
          }}
        />
      ) : null}
    </>
  )
}

const ConfirmDialog = ({
  slug,
  pending,
  onCancel,
  onConfirm,
}: {
  slug: string
  pending: boolean
  onCancel: () => void
  onConfirm: () => Promise<void>
}) => {
  const node = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${slug}-title`}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100_000,
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--theme-bg)',
          color: 'var(--theme-text)',
          padding: '1.5rem',
          borderRadius: '6px',
          maxWidth: '480px',
          width: '90vw',
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
        }}
      >
        <h3 id={`${slug}-title`} style={{ marginTop: 0 }}>
          Overwrite all Spanish content?
        </h3>
        <p style={{ marginBottom: '1.25rem', lineHeight: 1.5 }}>
          DeepL will translate every English field on this resource and replace whatever is currently in the Spanish
          locale. Manual ES edits made since the last translation will be lost.
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <Button buttonStyle="secondary" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={pending}>
            {pending ? 'Translating…' : 'Translate all to ES'}
          </Button>
        </div>
      </div>
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(node, document.body)
}

export default TranslateAllButton

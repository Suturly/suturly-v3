'use client'

import {
  toast,
  useConfig,
  useDocumentForm,
  useDocumentInfo,
  useFormFields,
  useLocale,
} from '@payloadcms/ui'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import {
  deepCloneForForm,
  isStaleSpanishAgainstEn,
  localizedFieldMatchesEnglish,
  readValueAtPath,
} from '@/collections/Resources/components/staleLocalizedShared'

type EnglishBaselineState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; value: unknown }
  | { status: 'error' }

/**
 * Lexical rich text inside arrays breaks when replacing the whole {@link Field} component.
 * Use `admin.components.beforeInput` so the default RichText editor mounts normally while ES still gets “Reset to English”.
 */
export const StaleLocalizedRichTextResetBeforeInput: React.FC<{
  path: string
  readOnly?: boolean
}> = ({ path, readOnly }) => {
  const locale = useLocale()?.code ?? 'en'

  const { dispatchFields, setModified, fields: docFields } = useDocumentForm()
  const translatedAt = docFields?.translatedAt?.value
  const enUpdatedAt = docFields?.enUpdatedAt?.value

  const stale = isStaleSpanishAgainstEn(locale, translatedAt, enUpdatedAt)

  const { id, collectionSlug } = useDocumentInfo()
  const { config } = useConfig()

  const [resetting, setResetting] = useState(false)
  const [enBaseline, setEnBaseline] = useState<EnglishBaselineState>({ status: 'idle' })

  const currentValue = useFormFields(useCallback(([fields]) => fields?.[path]?.value, [path]))

  const showToolbar = locale === 'es' && !readOnly && id !== undefined && id !== null && id !== ''

  const fetchEnglishValueAtPath = useCallback(async (): Promise<unknown | undefined> => {
    const slug = typeof collectionSlug === 'string' ? collectionSlug : ''
    if (!slug || id === undefined || id === null || id === '') return undefined

    const apiRoute = config?.routes?.api ?? '/api'
    const serverURL = typeof config.serverURL === 'string' ? config.serverURL.replace(/\/$/, '') : ''
    const qs = new URLSearchParams({
      locale: 'en',
      depth: '10',
      draft: 'true',
    })
    const url = `${serverURL}${apiRoute}/${encodeURIComponent(slug)}/${encodeURIComponent(String(id))}?${qs}`
    const res = await fetch(url, { credentials: 'include', method: 'GET' })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(text || `Failed to load English document (HTTP ${res.status}).`)
    }
    const data = (await res.json()) as Record<string, unknown>
    const docOrSelf = typeof data.doc === 'object' && data.doc !== null ? (data.doc as Record<string, unknown>) : data
    return readValueAtPath(docOrSelf, path.split('.').filter(Boolean))
  }, [collectionSlug, config?.routes?.api, config.serverURL, id, path])

  useEffect(() => {
    if (!showToolbar) {
      setEnBaseline({ status: 'idle' })
      return
    }
    let cancelled = false
    setEnBaseline({ status: 'loading' })
    void fetchEnglishValueAtPath()
      .then((value) => {
        if (!cancelled) setEnBaseline({ status: 'ready', value })
      })
      .catch(() => {
        if (!cancelled) setEnBaseline({ status: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [showToolbar, fetchEnglishValueAtPath, enUpdatedAt])

  const nothingToReset = useMemo(() => {
    if (enBaseline.status !== 'ready') return false
    return localizedFieldMatchesEnglish(currentValue, enBaseline.value)
  }, [currentValue, enBaseline])

  const baselinePending =
    showToolbar && (enBaseline.status === 'idle' || enBaseline.status === 'loading')

  const onReset = useCallback(async () => {
    if (readOnly || resetting) return
    setResetting(true)
    try {
      const enValue = await fetchEnglishValueAtPath()
      if (enValue === undefined) {
        toast.error('No English value found for this field (path mismatch or empty source).')
        return
      }
      dispatchFields({
        type: 'UPDATE',
        path,
        value: deepCloneForForm(enValue),
      })
      setModified(true)
      toast.success('Replaced this field with the English value.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not load English source.')
    } finally {
      setResetting(false)
    }
  }, [dispatchFields, fetchEnglishValueAtPath, path, readOnly, resetting, setModified])

  if (!showToolbar) return null

  const rowClass = [
    'stale-localized-reset-row',
    'stale-localized-reset-row--rich-text',
    stale ? 'stale-localized-reset-row--outline' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={rowClass}>
      <button
        type="button"
        className="array-field__header-action stale-localized-reset stale-localized-reset-rich-text"
        disabled={resetting || baselinePending || nothingToReset}
        title={
          nothingToReset && enBaseline.status === 'ready'
            ? 'This field already matches the English version.'
            : undefined
        }
        onClick={() => {
          void onReset()
        }}
      >
        {resetting ? 'Loading…' : baselinePending ? 'Checking…' : 'Reset to English'}
      </button>
    </div>
  )
}

export default StaleLocalizedRichTextResetBeforeInput

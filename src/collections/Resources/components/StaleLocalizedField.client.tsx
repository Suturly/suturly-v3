'use client'

import {
  RichTextField,
  TextField,
  TextareaField,
  toast,
  useConfig,
  useDocumentForm,
  useDocumentInfo,
  useFormFields,
  useLocale,
} from '@payloadcms/ui'
import { SlugField } from '@payloadcms/next/client'
import {
  MetaDescriptionComponent,
  MetaTitleComponent,
} from '@payloadcms/plugin-seo/client'
import type { PayloadComponent } from 'payload'
import type {
  RichTextFieldClientProps,
  TextareaFieldClientProps,
  TextFieldClientProps,
} from 'payload'
import React, { useCallback, useEffect, useMemo, useState } from 'react'

import { CitationRefKeyField } from '@/fields/CitationRefKey/Field'

import {
  deepCloneForForm,
  isStaleSpanishAgainstEn,
  localizedFieldMatchesEnglish,
  readValueAtPath,
} from '@/collections/Resources/components/staleLocalizedShared'
import { addEnMirroredFieldPath, normalizeEnMirroredFieldPaths } from '@/utilities/enMirroredFieldPaths'

type TranslatableFieldProps =
  | RichTextFieldClientProps
  | TextareaFieldClientProps
  | TextFieldClientProps

export type StaleLocalizedFieldExtraProps = {
  /** Existing custom Field payload (SlugField, SEO, citation ref picker, …). */
  innerField?: PayloadComponent
}

type StaleLocalizedFieldProps = TranslatableFieldProps & StaleLocalizedFieldExtraProps

function payloadComponentPath(component: PayloadComponent | undefined): string | undefined {
  if (component === undefined || component === null || component === false) return undefined
  if (typeof component === 'string') return component
  return typeof component.path === 'string' ? component.path : undefined
}

/**
 * SEO meta fields use a custom outer shell — keep the reset row stacked above the component.
 * Slug fields reserve the label row for lock/generate controls — stacked avoids overlapping reset.
 * Plain text/textarea/citation use {@link custom.scss} `.stale-localized-field--label-row-grid`: reset is
 * absolutely positioned so the field stays full width (grid + `display:contents` narrowed inputs in arrays).
 */
function usesStaleLabelRowGrid(innerField: PayloadComponent | undefined): boolean {
  const key = payloadComponentPath(innerField)
  if (key === undefined) return true
  if (key === '@payloadcms/next/client#SlugField') return false
  if (key === '@/fields/CitationRefKey/Field#CitationRefKeyField') return true
  return false
}

function mergeInnerClientProps<P extends TranslatableFieldProps>(
  outer: P,
  inner: PayloadComponent | undefined,
): P {
  if (
    inner === undefined ||
    inner === null ||
    inner === false ||
    typeof inner === 'string'
  ) {
    return outer
  }
  if (!inner.clientProps || typeof inner.clientProps !== 'object') return outer
  return {
    ...outer,
    ...(inner.clientProps as Record<string, unknown>),
  } as P
}

/** Maps payload `admin.components.Field.path` tokens to implementations we wrap. */
function resolveInnerElement(
  fieldType: 'richText' | 'text' | 'textarea',
  inner: PayloadComponent | undefined,
): React.ComponentType<TranslatableFieldProps> {
  const key = payloadComponentPath(inner)
  switch (key) {
    case '@payloadcms/next/client#SlugField':
      return SlugField as unknown as React.ComponentType<TranslatableFieldProps>
    case '@payloadcms/plugin-seo/client#MetaTitleComponent':
      return MetaTitleComponent as unknown as React.ComponentType<TranslatableFieldProps>
    case '@payloadcms/plugin-seo/client#MetaDescriptionComponent':
      return MetaDescriptionComponent as unknown as React.ComponentType<TranslatableFieldProps>
    case '@/fields/CitationRefKey/Field#CitationRefKeyField':
      return CitationRefKeyField as unknown as React.ComponentType<TranslatableFieldProps>
    default:
      break
  }

  switch (fieldType) {
    case 'richText':
      return RichTextField as unknown as React.ComponentType<TranslatableFieldProps>
    case 'textarea':
      return TextareaField as unknown as React.ComponentType<TranslatableFieldProps>
    default:
      return TextField as unknown as React.ComponentType<TranslatableFieldProps>
  }
}

type EnglishBaselineState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; value: unknown }
  | { status: 'error' }

/**
 * Resources-only admin wrapper: stale outline on Spanish locale when EN changed after translation,
 * plus a row-level Reset that copies one field path from the English REST snapshot into the ES form path.
 *
 * Compose with existing custom Field configs (Slug, SEO citation picker) via `innerField` from {@link markLocalized}.
 */
export const StaleLocalizedField: React.FC<StaleLocalizedFieldProps> = (props) => {
  const { field, path, readOnly, innerField } = props
  const fieldType = field.type as 'richText' | 'textarea' | 'text'
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

  const Inner = resolveInnerElement(fieldType, innerField)

  const innerProps = mergeInnerClientProps(props, innerField)

  const fetchEnglishValueAtPath = useCallback(async (): Promise<unknown | undefined> => {
    const slug = typeof collectionSlug === 'string' ? collectionSlug : ''
    if (!slug || id === undefined || id === null || id === '') return undefined

    const apiRoute = config?.routes?.api ?? '/api'
    const qs = new URLSearchParams({
      locale: 'en',
      depth: '10',
      draft: 'true',
    })
    // Same-origin only — config.serverURL may be www while admin runs on *.vercel.app (cookies + CSRF).
    const url = `${apiRoute}/${encodeURIComponent(slug)}/${encodeURIComponent(String(id))}?${qs}`
    const res = await fetch(url, { credentials: 'include', method: 'GET' })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(text || `Failed to load English document (HTTP ${res.status}).`)
    }
    const data = (await res.json()) as Record<string, unknown>
    const docOrSelf = typeof data.doc === 'object' && data.doc !== null ? (data.doc as Record<string, unknown>) : data
    return readValueAtPath(docOrSelf, path.split('.').filter(Boolean))
  }, [collectionSlug, config?.routes?.api, id, path])

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

      const currentPaths = normalizeEnMirroredFieldPaths(docFields?.enMirroredFieldPaths?.value)
      const nextPaths = addEnMirroredFieldPath(currentPaths, path)
      dispatchFields({
        type: 'UPDATE',
        path: 'enMirroredFieldPaths',
        value: nextPaths,
      })

      setModified(true)
      toast.success(
        'Reset to English. This field will follow English until you edit Spanish or run Translate all.',
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not load English source.')
    } finally {
      setResetting(false)
    }
  }, [dispatchFields, docFields?.enMirroredFieldPaths?.value, fetchEnglishValueAtPath, path, readOnly, resetting, setModified])

  const showToolbar = locale === 'es' && !readOnly && id !== undefined && id !== null && id !== ''

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

  const labelRowGrid = usesStaleLabelRowGrid(innerField)

  const wrapperClassName = useMemo(
    () =>
      [
        'stale-localized-field',
        labelRowGrid ? 'stale-localized-field--label-row-grid' : 'stale-localized-field--stacked',
        locale === 'es' && stale ? 'stale-localized-field--outline' : '',
      ]
        .filter(Boolean)
        .join(' '),
    [labelRowGrid, locale, stale],
  )

  return (
    <div className={wrapperClassName}>
      {showToolbar ? (
        <div className="stale-localized-reset-row">
          <button
            type="button"
            className="array-field__header-action stale-localized-reset"
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
      ) : null}
      <Inner {...innerProps} />
    </div>
  )
}

export default StaleLocalizedField

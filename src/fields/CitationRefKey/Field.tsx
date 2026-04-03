'use client'

import {
  FieldDescription,
  FieldError,
  FieldLabel,
  ReactSelect,
  type ReactSelectOption,
  useDocumentForm,
  useField,
} from '@payloadcms/ui'
import type { TextFieldClientProps, Validate } from 'payload'
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { components as selectComponents, type MenuListProps } from 'react-select'

import { fieldBaseClass } from '@payloadcms/ui/fields/shared'

const CREATE_VALUE = '__citation_ref_create_new__'

/** Resources collection slug — citations array & this field only exist here. */
const RESOURCES_SCHEMA_PATH = 'posts'

type CitationRow = { bibliography: string; key: string; url: string }

function trimLabel(text: string, max = 80): string {
  const t = text.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max)}…`
}

type CitationRefKeyMenuContextValue = {
  path: string
  creating: boolean
  newBibliography: string
  setNewBibliography: (v: string) => void
  newUrl: string
  setNewUrl: (v: string) => void
  addNewCitation: () => void
  cancelCreate: () => void
  bibInputRef: React.RefObject<HTMLTextAreaElement | null>
}

const CitationRefKeyMenuContext = createContext<CitationRefKeyMenuContextValue | null>(null)

/** Module-level: stable reference for react-select — avoids remounting the menu on each keystroke. */
function CitationRefKeyMenuList(menuProps: MenuListProps<ReactSelectOption>) {
  const ctx = useContext(CitationRefKeyMenuContext)
  return (
    <selectComponents.MenuList {...menuProps}>
      {menuProps.children}
      {ctx?.creating ? (
        <div
          className="citation-ref-key-field__create"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          role="presentation"
          style={{
            borderTop: '1px solid var(--theme-elevation-150)',
            padding: '0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <label htmlFor={`${ctx.path}-new-bib`} style={{ fontSize: '0.85rem', fontWeight: 600 }}>
            New bibliography line
          </label>
          <textarea
            ref={ctx.bibInputRef}
            id={`${ctx.path}-new-bib`}
            autoComplete="off"
            onChange={(e) => ctx.setNewBibliography(e.target.value)}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            placeholder="Required"
            rows={3}
            style={{ width: '100%', font: 'inherit' }}
            value={ctx.newBibliography}
          />
          <label htmlFor={`${ctx.path}-new-url`} style={{ fontSize: '0.85rem', fontWeight: 600 }}>
            URL (optional)
          </label>
          <input
            id={`${ctx.path}-new-url`}
            autoComplete="off"
            onChange={(e) => ctx.setNewUrl(e.target.value)}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            placeholder="https://…"
            type="text"
            style={{ width: '100%', font: 'inherit' }}
            value={ctx.newUrl}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <button
              className="btn btn--style-primary btn--size-small"
              onClick={ctx.addNewCitation}
              onMouseDown={(e) => e.stopPropagation()}
              type="button"
            >
              Save &amp; use
            </button>
            <button
              className="btn btn--style-secondary btn--size-small"
              onClick={ctx.cancelCreate}
              onMouseDown={(e) => e.stopPropagation()}
              type="button"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </selectComponents.MenuList>
  )
}

const STABLE_SELECT_COMPONENTS = { MenuList: CitationRefKeyMenuList }

export const CitationRefKeyField: React.FC<TextFieldClientProps> = (props) => {
  const {
    field: {
      admin: { description } = {},
      label,
      localized,
      required,
    },
    path,
    readOnly,
    validate,
  } = props

  const wrappedValidate: Validate | undefined = validate
    ? (val, options) => validate(val as string | null | undefined, options as never)
    : undefined

  const {
    customComponents: { Description, Error, Label } = {},
    disabled: fieldDisabled,
    setValue,
    showError,
    value: rawValue,
  } = useField<string>({
    path,
    validate: wrappedValidate,
  })

  const value = typeof rawValue === 'string' ? rawValue : ''

  const { addFieldRow, fields } = useDocumentForm()

  const citationRows = useMemo((): CitationRow[] => {
    const rows: CitationRow[] = []
    if (!fields) return rows
    let i = 0
    while (fields[`citations.${i}.id`]) {
      rows.push({
        key: String(fields[`citations.${i}.key`]?.value ?? ''),
        bibliography: String(fields[`citations.${i}.bibliography`]?.value ?? ''),
        url: String(fields[`citations.${i}.url`]?.value ?? ''),
      })
      i += 1
      if (i > 500) break
    }
    return rows
  }, [fields])

  const selectOptions = useMemo((): ReactSelectOption[] => {
    const fromDoc = citationRows
      .filter((r) => r.key.trim())
      .map((r) => {
        const bib = r.bibliography.trim()
        return {
          label: trimLabel(bib || 'Bibliography entry'),
          value: r.key.trim(),
        }
      })
      .sort((a, b) => a.label.localeCompare(b.label))

    const byValue = new Map(fromDoc.map((o) => [String(o.value), o]))
    const withOrphan: ReactSelectOption[] = [...fromDoc]

    if (value.trim() && !byValue.has(value.trim())) {
      withOrphan.unshift({
        label: 'Unknown source — add it on the Citations tab or pick another',
        value: value.trim(),
      })
    }

    return [
      ...withOrphan,
      {
        label: '+ Create new…',
        value: CREATE_VALUE,
      },
    ]
  }, [citationRows, value])

  const selectedOption = useMemo(() => {
    const v = value.trim()
    if (!v) return undefined
    return selectOptions.find((o) => String(o.value) === v && o.value !== CREATE_VALUE)
  }, [selectOptions, value])

  const [menuOpen, setMenuOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newBibliography, setNewBibliography] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const newBibRef = useRef<HTMLTextAreaElement>(null)
  /** True synchronously when user chose "+ Create new…" — react-select still fires onMenuClose and would otherwise run resetCreate(). */
  const openingCreateModeRef = useRef(false)

  useEffect(() => {
    if (!creating) return
    const id = requestAnimationFrame(() => newBibRef.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [creating])

  const disabled = Boolean(readOnly || fieldDisabled)

  const resetCreate = useCallback(() => {
    setCreating(false)
    setNewBibliography('')
    setNewUrl('')
  }, [])

  const onMenuClose = useCallback(() => {
    if (openingCreateModeRef.current) {
      openingCreateModeRef.current = false
      setMenuOpen(true)
      return
    }
    setMenuOpen(false)
    resetCreate()
  }, [resetCreate])

  const onSelectChange = useCallback(
    (opt: ReactSelectOption | ReactSelectOption[] | null) => {
      if (disabled) return
      const single = Array.isArray(opt) ? opt[0] : opt
      if (!single || single.value === null || single.value === undefined) return
      const v = String(single.value)
      if (v === CREATE_VALUE) {
        openingCreateModeRef.current = true
        setCreating(true)
        setMenuOpen(true)
        return
      }
      resetCreate()
      setValue(v)
      setMenuOpen(false)
    },
    [disabled, resetCreate, setValue],
  )

  const cancelCreate = useCallback(() => {
    resetCreate()
    setMenuOpen(false)
  }, [resetCreate])

  const addNewCitation = useCallback(() => {
    const bib = newBibliography.trim()
    if (!bib || disabled) return
    const key = crypto.randomUUID()
    const url = newUrl.trim()
    const rowIndex = citationRows.length
    addFieldRow({
      path: 'citations',
      rowIndex,
      schemaPath: RESOURCES_SCHEMA_PATH,
      subFieldState: {
        key: {
          initialValue: key,
          passesCondition: true,
          valid: true,
          value: key,
        },
        bibliography: {
          initialValue: bib,
          passesCondition: true,
          valid: true,
          value: bib,
        },
        url: {
          initialValue: url,
          passesCondition: true,
          valid: true,
          value: url,
        },
      },
    })
    setValue(key)
    resetCreate()
    setMenuOpen(false)
  }, [
    addFieldRow,
    citationRows.length,
    disabled,
    newBibliography,
    newUrl,
    resetCreate,
    setValue,
  ])

  const menuContextValue = useMemo(
    (): CitationRefKeyMenuContextValue => ({
      path,
      creating,
      newBibliography,
      setNewBibliography,
      newUrl,
      setNewUrl,
      addNewCitation,
      cancelCreate,
      bibInputRef: newBibRef,
    }),
    [
      path,
      creating,
      newBibliography,
      newUrl,
      addNewCitation,
      cancelCreate,
    ],
  )

  const wrapperClass = [fieldBaseClass, 'text', showError && 'error', disabled && 'read-only']
    .filter(Boolean)
    .join(' ')

  const labelNode =
    Label !== undefined ? (
      Label
    ) : (
      <FieldLabel label={label} localized={localized} path={path} required={required} />
    )

  const descriptionNode =
    Description ||
    (description ? (
      <FieldDescription description={description} path={path} />
    ) : null)

  return (
    <div className={wrapperClass}>
      {labelNode}
      <div className={`${fieldBaseClass}__wrap`}>
        {descriptionNode}
        <CitationRefKeyMenuContext.Provider value={menuContextValue}>
          <ReactSelect
            components={STABLE_SELECT_COMPONENTS}
            disabled={disabled}
            isClearable={false}
            menuIsOpen={menuOpen}
            onChange={onSelectChange}
            onMenuClose={onMenuClose}
            onMenuOpen={() => setMenuOpen(true)}
            options={selectOptions}
            showError={showError}
            value={selectedOption}
            {...({
              blurInputOnSelect: false,
              closeMenuOnSelect: false,
            } as Record<string, unknown>)}
          />
        </CitationRefKeyMenuContext.Provider>
        {showError && (Error !== undefined ? Error : <FieldError path={path} showError={showError} />)}
      </div>
    </div>
  )
}

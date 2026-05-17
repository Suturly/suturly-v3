'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/utilities/ui'
import { Copy } from 'lucide-react'
import React from 'react'

type ToDoItem = {
  checked?: boolean | null
  id?: string | null
  label?: string | null
}

type Props = {
  className?: string
  items?: ToDoItem[] | null
  showCopyButton?: boolean | null
  copyButtonLabel?: string | null
}

export const ToDoList: React.FC<Props> = ({
  className,
  items,
  showCopyButton,
  copyButtonLabel,
}) => {
  const [isCopied, setIsCopied] = React.useState(false)
  /** When null, use CMS `checked` from each row; when set, local toggles override. */
  const [localChecked, setLocalChecked] = React.useState<boolean[] | null>(null)

  const rows = Array.isArray(items)
    ? items.filter((item): item is ToDoItem & { label: string } => Boolean(item?.label?.trim()))
    : []

  const itemsContentKey = React.useMemo(() => {
    if (!Array.isArray(items)) return ''
    return JSON.stringify(
      items.map((r) => ({
        id: r?.id ?? null,
        label: typeof r?.label === 'string' ? r.label : '',
        checked: r?.checked ?? null,
      })),
    )
  }, [items])

  React.useEffect(() => {
    setLocalChecked(null)
  }, [itemsContentKey])

  const resolvedChecked = React.useMemo(() => {
    const fromCms = rows.map((item) => Boolean(item.checked))
    if (localChecked !== null && localChecked.length === rows.length) {
      return localChecked
    }
    return fromCms
  }, [rows, localChecked])

  const toggleRow = (index: number) => {
    setLocalChecked((prev) => {
      const fromCms = rows.map((item) => Boolean(item.checked))
      const base =
        prev !== null && prev.length === rows.length ? [...prev] : [...fromCms]
      base[index] = !base[index]
      return base
    })
  }

  if (rows.length === 0) return null

  const resolvedCopyLabel = copyButtonLabel?.trim() || 'Copy list'

  const handleCopy = async () => {
    const plainList = rows
      .map((item, i) => `${resolvedChecked[i] ? '[x]' : '[ ]'} ${item.label}`)
      .join('\n')

    try {
      await navigator.clipboard.writeText(plainList)
      setIsCopied(true)
      window.setTimeout(() => setIsCopied(false), 1800)
    } catch {
      setIsCopied(false)
    }
  }

  return (
    <div className={cn('not-prose resource-block-todo', className)}>
      <ul className="resource-block-todo__list">
        {rows.map((item, index) => (
          <li
            className={cn('resource-block-todo__item', resolvedChecked[index] && 'is-checked')}
            key={
              item.id != null && item.id !== ''
                ? `${item.id}-${index}`
                : `todo-${index}-${item.label ?? ''}`
            }
          >
            <label className="resource-block-todo__row">
              <input
                checked={resolvedChecked[index]}
                className="sr-only"
                type="checkbox"
                onChange={() => toggleRow(index)}
              />
              <span aria-hidden className="resource-block-todo__marker">
                {resolvedChecked[index] ? <span className="resource-block-todo__marker-dot" /> : null}
              </span>
              <span className="resource-block-todo__text">{item.label}</span>
            </label>
          </li>
        ))}
      </ul>

      {showCopyButton ? (
        <div className="resource-block-todo__copy">
          <Button
            className="resource-block-todo__copy-button"
            iconLeft={<Copy />}
            onClick={handleCopy}
            size="small"
            type="button"
            variant="outline"
          >
            {isCopied ? 'Copied' : resolvedCopyLabel}
          </Button>
        </div>
      ) : null}
    </div>
  )
}

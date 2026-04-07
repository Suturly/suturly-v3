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

  const rows = Array.isArray(items)
    ? items.filter((item): item is ToDoItem & { label: string } => Boolean(item?.label?.trim()))
    : []

  if (rows.length === 0) return null

  const resolvedCopyLabel = copyButtonLabel?.trim() || 'Copy list'

  const handleCopy = async () => {
    const plainList = rows.map((item) => `${item.checked ? '[x]' : '[ ]'} ${item.label}`).join('\n')

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
            className={cn('resource-block-todo__item', item.checked && 'is-checked')}
            key={
              item.id != null && item.id !== ''
                ? `${item.id}-${index}`
                : `todo-${index}-${item.label ?? ''}`
            }
          >
            <span aria-hidden className="resource-block-todo__marker">
              {item.checked ? <span className="resource-block-todo__marker-dot" /> : null}
            </span>
            <span className="resource-block-todo__text">{item.label}</span>
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

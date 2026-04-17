import { cn } from '@/utilities/ui'
import { Slot, Slottable } from '@radix-ui/react-slot'
import * as React from 'react'

type ButtonVariant = 'default' | 'destructive' | 'ghost' | 'link' | 'outline' | 'secondary'
type ButtonSize = 'big' | 'default' | 'icon' | 'small'

const variantClassMap: Record<ButtonVariant, string> = {
  default: 'primary',
  destructive: 'destructive',
  ghost: 'ghost',
  link: 'link',
  outline: 'outline',
  secondary: 'secondary',
}

const sizeClassMap: Record<ButtonSize, string> = {
  big: 'size-big',
  default: 'size-default',
  icon: 'size-icon',
  small: 'size-small',
}

type ButtonVariantsInput = {
  className?: string
  size?: ButtonSize | null
  variant?: ButtonVariant | null
}

const buttonVariants = ({ className, size, variant }: ButtonVariantsInput = {}) => {
  const resolvedVariant: ButtonVariant = variant ?? 'default'
  const resolvedSize: ButtonSize = size ?? 'big'

  return cn('ui-button', variantClassMap[resolvedVariant], sizeClassMap[resolvedSize], className)
}

export interface ButtonProps
  extends Omit<React.ComponentProps<'button'>, 'href'> {
  /** Renders a native `<a>` with button styles. Ignored when `asChild` is true (child owns the link). */
  href?: string
  asChild?: boolean
  iconLeft?: React.ReactNode
  iconRight?: React.ReactNode
  size?: ButtonSize
  variant?: ButtonVariant
}

const Button: React.FC<ButtonProps> = ({
  asChild = false,
  className,
  size,
  variant,
  iconLeft,
  iconRight,
  children,
  href,
  type,
  ...props
}) => {
  const hasLeftIcon = Boolean(iconLeft)
  const hasRightIcon = Boolean(iconRight)
  const resolvedVariant: ButtonVariant = variant ?? 'default'
  const resolvedSize: ButtonSize = size ?? 'big'

  const sharedProps = {
    'data-slot': 'button' as const,
    className: cn(buttonVariants({ variant: resolvedVariant, size: resolvedSize, className })),
    'data-size': resolvedSize,
    'data-left-icon': hasLeftIcon,
    'data-right-icon': hasRightIcon,
  }

  const inner = (
    <>
      {iconLeft ? <span data-slot="button-icon">{iconLeft}</span> : null}
      <Slottable>{children}</Slottable>
      {iconRight ? <span data-slot="button-icon">{iconRight}</span> : null}
    </>
  )

  if (asChild) {
    return (
      <Slot {...sharedProps} {...(type !== undefined ? { type } : {})} {...props}>
        {inner}
      </Slot>
    )
  }

  if (href) {
    return (
      <a {...sharedProps} href={href} {...(props as React.ComponentPropsWithoutRef<'a'>)}>
        {inner}
      </a>
    )
  }

  return (
    <button {...sharedProps} type={type ?? 'button'} {...props}>
      {inner}
    </button>
  )
}

export { Button, buttonVariants }

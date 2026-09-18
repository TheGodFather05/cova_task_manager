import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  pending?: boolean
  pendingLabel?: string
  children: ReactNode
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-deep disabled:bg-primary/40',
  // orange marks the one action the user is being invited to take
  accent: 'bg-accent text-white hover:bg-accent-hover disabled:bg-accent/40',
  secondary:
    'border border-primary bg-surface text-primary-deep hover:bg-primary-tint disabled:opacity-50',
  ghost: 'border border-line bg-surface text-muted hover:border-primary hover:text-primary disabled:opacity-50',
  danger: 'bg-danger text-white hover:bg-danger/85 disabled:bg-danger/40',
}

export function Button({
  variant = 'primary',
  pending = false,
  pendingLabel,
  children,
  className = '',
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-control px-5 py-3
                  text-secondary font-semibold transition-colors
                  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
                  disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
    >
      {pending ? <Spinner /> : null}
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  )
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="size-3.5 shrink-0 rounded-pill border-2 border-current border-t-transparent
                 [animation:tm-spin_0.8s_linear_infinite]"
    />
  )
}

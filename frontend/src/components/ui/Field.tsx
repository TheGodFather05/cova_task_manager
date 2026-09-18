import { useId, type InputHTMLAttributes } from 'react'

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
}

export function Field({ label, error, hint, ...input }: FieldProps) {
  const id = useId()
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-secondary font-medium text-ink">
        {label}
      </label>
      <input
        {...input}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`w-full rounded-control border px-3.5 py-3 text-secondary text-ink
                    transition-colors outline-none placeholder:text-faint
                    focus:border-primary focus:ring-2 focus:ring-primary/20
                    ${
                      error
                        ? 'border-danger bg-danger-tint/40'
                        : 'border-line bg-raised'
                    }`}
      />
      {error ? (
        <p id={`${id}-error`} className="text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

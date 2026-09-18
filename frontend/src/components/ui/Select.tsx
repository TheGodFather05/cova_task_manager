import { useId, type SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  options: { value: string; label: string }[]
}

export function Select({ label, error, options, ...select }: SelectProps) {
  const id = useId()

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-secondary font-medium text-ink">
        {label}
      </label>
      <select
        {...select}
        id={id}
        aria-invalid={error ? true : undefined}
        className={`w-full appearance-none rounded-control border bg-raised bg-[length:12px]
                    bg-[right_14px_center] bg-no-repeat px-3.5 py-3 text-secondary text-ink
                    transition-colors outline-none focus:border-primary focus:ring-2
                    focus:ring-primary/20 ${error ? 'border-danger' : 'border-line'}`}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'%3E%3Cpath d='M1 1.5 6 6.5l5-5' fill='none' stroke='%236B7280' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  )
}

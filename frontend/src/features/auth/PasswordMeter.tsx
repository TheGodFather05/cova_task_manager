import { assessPassword } from './passwordStrength'

const SEGMENTS = [0, 1, 2, 3]

export function PasswordMeter({ password }: { password: string }) {
  const { score, label, hint } = assessPassword(password)

  if (!password) {
    return null
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1.5" role="presentation">
        {SEGMENTS.map((segment) => (
          <span
            key={segment}
            className={`h-1 flex-1 rounded-[2px] transition-colors ${
              segment < score ? 'bg-primary' : 'bg-line'
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-muted" aria-live="polite">
        {label}
        {hint ? ` — ${hint}` : ''}
      </p>
    </div>
  )
}

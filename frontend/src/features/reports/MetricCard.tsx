import { formatDelta } from './chartMath'

interface MetricCardProps {
  label: string
  /** null means the backend declined to state a value, not zero */
  value: number | null
  suffix?: string
  delta: number | null
  deltaSuffix?: string
  note: string
}

export function MetricCard({ label, value, suffix = '', delta, deltaSuffix = '', note }: MetricCardProps) {
  const rising = delta !== null && delta > 0
  const falling = delta !== null && delta < 0

  return (
    <article className="flex flex-col gap-2.5 rounded-card border border-line bg-surface px-5 py-5 shadow-[0_1px_2px_rgb(14_95_97/0.05)]">
      <h3 className="text-[12.5px] font-semibold tracking-[0.06em] text-muted uppercase">
        {label}
      </h3>
      <p className="text-[32px] leading-none font-semibold text-primary-deep">
        {/* an em dash, never 0: the API refused to state this, so neither do we */}
        {value === null ? '—' : `${value}${suffix}`}
      </p>
      <div className="flex items-center gap-2">
        <span
          className={`text-xs font-semibold ${
            rising ? 'text-primary' : falling ? 'text-accent-hover dark:text-accent' : 'text-muted'
          }`}
        >
          {formatDelta(delta, deltaSuffix)}
        </span>
        <span className="text-xs text-muted">{note}</span>
      </div>
    </article>
  )
}

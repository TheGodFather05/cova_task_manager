import { PERIODS, type Period } from '../../types/report'

const LABELS: Record<Period, string> = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  YEARLY: 'Yearly',
}

export function PeriodSelector({
  period,
  onChange,
}: {
  period: Period
  onChange: (period: Period) => void
}) {
  return (
    <div
      role="tablist"
      aria-label="Report period"
      className="flex gap-1 overflow-x-auto rounded-control bg-primary-tint p-1"
    >
      {PERIODS.map((value) => (
        <button
          key={value}
          type="button"
          role="tab"
          aria-selected={period === value}
          onClick={() => onChange(value)}
          className={`shrink-0 rounded-lg px-4 py-2 text-[13px] font-semibold transition-colors
                      focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                        period === value
                          ? 'bg-primary text-on-primary'
                          : 'text-primary-deep hover:bg-surface/60'
                      }`}
        >
          {LABELS[value]}
        </button>
      ))}
    </div>
  )
}

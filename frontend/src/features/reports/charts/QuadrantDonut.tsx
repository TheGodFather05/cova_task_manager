import { QUADRANT_LABELS } from '../../../types/labels'
import type { QuadrantCount } from '../../../types/report'
import { toConicStops } from '../chartMath'
import { ChartEmpty } from './ChartCard'

const COLORS: Record<string, string> = {
  DO_FIRST: 'var(--color-do-first)',
  SCHEDULE: 'var(--color-schedule)',
  DELEGATE: 'var(--color-delegate)',
  DROP: 'var(--color-drop)',
}

export function QuadrantDonut({ quadrants, total }: { quadrants: QuadrantCount[]; total: number }) {
  const gradient = toConicStops(
    quadrants.map((entry) => ({ color: COLORS[entry.quadrant], value: entry.count })),
  )

  // a zero total would render as one solid colour, implying a 100% share that does not exist
  if (!gradient) {
    return <ChartEmpty message="No open tasks right now." />
  }

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-7">
      <div className="relative size-[132px] shrink-0" style={{ background: gradient, borderRadius: '50%' }}>
        <div className="absolute inset-[22%] flex flex-col items-center justify-center rounded-pill bg-surface">
          <span className="text-heading font-semibold text-ink">{total}</span>
          <span className="text-[11px] text-muted">open</span>
        </div>
      </div>

      <ul className="flex w-full flex-col gap-2">
        {quadrants.map((entry) => (
          <li key={entry.quadrant} className="flex items-center gap-2.5 text-xs">
            <span
              className="size-2.5 shrink-0 rounded-pill"
              style={{ background: COLORS[entry.quadrant] }}
            />
            <span className="flex-1 text-ink">{QUADRANT_LABELS[entry.quadrant]}</span>
            <span className="text-muted">{entry.percentage}%</span>
            <span className="w-6 text-right font-semibold text-ink">{entry.count}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

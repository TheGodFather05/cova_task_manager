import { STATUS_LABELS } from '../../../types/labels'
import type { StatusCounts } from '../../../types/report'
import { TASK_STATUSES } from '../../../types/task'
import { ChartEmpty } from './ChartCard'

const BARS = {
  TODO: 'bg-drop',
  IN_PROGRESS: 'bg-accent',
  DONE: 'bg-primary',
} as const

/**
 * The kit calls this a funnel, but the three counts are disjoint sets rather than sequential
 * stages — a funnel would imply drop-off between them. Same data, honest label.
 */
export function StatusBars({ counts }: { counts: StatusCounts }) {
  const values = TASK_STATUSES.map((status) => counts[status])
  const total = values.reduce((sum, value) => sum + value, 0)

  if (total === 0) {
    return <ChartEmpty message="No tasks yet." />
  }

  const max = Math.max(...values, 1)

  return (
    <ul className="flex flex-col gap-3">
      {TASK_STATUSES.map((status) => (
        <li key={status} className="flex items-center gap-3">
          <span className="w-20 shrink-0 text-xs text-muted">{STATUS_LABELS[status]}</span>
          <div className="h-6 flex-1 overflow-hidden rounded-lg bg-line-soft">
            <div
              className={`h-full rounded-lg transition-[width] ${BARS[status]}`}
              style={{ width: `${(counts[status] / max) * 100}%` }}
            />
          </div>
          <span className="w-8 text-right text-xs font-semibold text-ink">{counts[status]}</span>
        </li>
      ))}
    </ul>
  )
}

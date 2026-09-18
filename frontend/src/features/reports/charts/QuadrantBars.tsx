import { QUADRANT_LABELS } from '../../../types/labels'
import type { QuadrantCount } from '../../../types/report'
import { toBarHeight } from '../chartMath'
import { ChartEmpty } from './ChartCard'

const BARS: Record<string, string> = {
  DO_FIRST: 'bg-do-first',
  SCHEDULE: 'bg-schedule',
  DELEGATE: 'bg-delegate',
  DROP: 'bg-drop',
}

export function QuadrantBars({ quadrants, total }: { quadrants: QuadrantCount[]; total: number }) {
  if (total === 0) {
    return <ChartEmpty message="Nothing completed in this period." />
  }

  const counts = quadrants.map((entry) => entry.count)

  return (
    <div className="flex items-end gap-4" style={{ height: 180 }}>
      {quadrants.map((entry) => (
        <div key={entry.quadrant} className="flex h-full flex-1 flex-col items-center gap-2">
          <span className="text-xs font-semibold text-ink">{entry.count}</span>
          <div className="flex w-full flex-1 items-end">
            <div
              title={`${QUADRANT_LABELS[entry.quadrant]}: ${entry.count} (${entry.percentage}%)`}
              // height is a share of the tallest bar, so four equal quadrants fill the track
              style={{ height: `${toBarHeight(entry.count, counts)}%` }}
              className={`w-full rounded-t-lg transition-[height] ${BARS[entry.quadrant]}`}
            />
          </div>
          <span className="text-center text-[11px] text-muted">
            {QUADRANT_LABELS[entry.quadrant]}
          </span>
        </div>
      ))}
    </div>
  )
}

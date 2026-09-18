import { QUADRANT_AXES, QUADRANT_LABELS } from '../../types/labels'
import type { Quadrant } from '../../types/task'

const DOTS: Record<Quadrant, string> = {
  DO_FIRST: 'bg-do-first',
  SCHEDULE: 'bg-schedule',
  DELEGATE: 'bg-delegate',
  DROP: 'bg-drop',
}

export function QuadrantBadge({
  quadrant,
  showAxes = false,
}: {
  quadrant: Quadrant
  showAxes?: boolean
}) {
  return (
    <span
      className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-line
                 bg-surface px-2.5 py-1.5 text-xs font-semibold text-ink"
      title={QUADRANT_AXES[quadrant]}
    >
      <span className={`size-2 rounded-pill ${DOTS[quadrant]}`} />
      {QUADRANT_LABELS[quadrant]}
      {showAxes ? <span className="font-normal text-muted">{QUADRANT_AXES[quadrant]}</span> : null}
    </span>
  )
}

import { QUADRANT_AXES, QUADRANT_LABELS } from '../../types/labels'
import type { Quadrant } from '../../types/task'
import { QUADRANT_CELLS, quadrantOf, type Axes } from './quadrant'

const DOTS: Record<Quadrant, string> = {
  DO_FIRST: 'bg-do-first',
  SCHEDULE: 'bg-schedule',
  DELEGATE: 'bg-delegate',
  DROP: 'bg-drop',
}

interface QuadrantSelectorProps {
  value: Axes | null
  onChange: (axes: Axes) => void
  error?: string
}

export function QuadrantSelector({ value, onChange, error }: QuadrantSelectorProps) {
  const selected = value ? quadrantOf(value.importance, value.urgency) : null

  return (
    <fieldset className="flex flex-col gap-2.5">
      <legend className="text-secondary font-medium text-ink">Priority</legend>
      <p className="text-xs text-muted">One tap sets both badges.</p>

      <div
        role="radiogroup"
        aria-label="Priority"
        className="grid grid-cols-[20px_1fr_1fr] grid-rows-[auto_1fr_1fr] gap-2.5"
      >
        <span />
        <AxisLabel>Urgent</AxisLabel>
        <AxisLabel>Not urgent</AxisLabel>

        <RowLabel>Important</RowLabel>
        <Cell cell={QUADRANT_CELLS[0]} selected={selected} onChange={onChange} />
        <Cell cell={QUADRANT_CELLS[1]} selected={selected} onChange={onChange} />

        <RowLabel>Not important</RowLabel>
        <Cell cell={QUADRANT_CELLS[2]} selected={selected} onChange={onChange} />
        <Cell cell={QUADRANT_CELLS[3]} selected={selected} onChange={onChange} />
      </div>

      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : (
        <p className="text-xs text-muted">
          {selected ? QUADRANT_AXES[selected] : 'No priority set yet'}
        </p>
      )}
    </fieldset>
  )
}

function AxisLabel({ children }: { children: string }) {
  return (
    <span className="text-center text-[11.5px] font-semibold tracking-[0.08em] text-primary-deep uppercase">
      {children}
    </span>
  )
}

function RowLabel({ children }: { children: string }) {
  return (
    <span className="flex items-center justify-center text-[11.5px] font-semibold tracking-[0.08em] text-primary-deep uppercase [writing-mode:vertical-rl] [transform:rotate(180deg)]">
      {children}
    </span>
  )
}

function Cell({
  cell,
  selected,
  onChange,
}: {
  cell: (typeof QUADRANT_CELLS)[number]
  selected: Quadrant | null
  onChange: (axes: Axes) => void
}) {
  const isSelected = selected === cell.quadrant

  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      // both axes are written in one call, so no render ever sees half a selection
      onClick={() => onChange({ importance: cell.importance, urgency: cell.urgency })}
      className={`flex min-h-[86px] flex-col gap-2 rounded-control border p-4 text-left
                  transition-colors focus-visible:outline-2 focus-visible:outline-offset-2
                  focus-visible:outline-primary ${
                    isSelected
                      ? 'border-primary bg-primary-tint'
                      : 'border-line bg-surface hover:border-primary/50'
                  }`}
    >
      <span className="flex items-center gap-2">
        <span className={`size-2.5 rounded-pill ${DOTS[cell.quadrant]}`} />
        <span className="text-secondary font-semibold text-ink">
          {QUADRANT_LABELS[cell.quadrant]}
        </span>
        {isSelected ? <span className="ml-auto text-primary">✓</span> : null}
      </span>
      <span className="text-xs text-muted">{QUADRANT_AXES[cell.quadrant]}</span>
    </button>
  )
}

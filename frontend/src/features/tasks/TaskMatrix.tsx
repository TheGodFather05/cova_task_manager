import { StatusBadge } from '../../components/ui'
import { QUADRANT_AXES, QUADRANT_LABELS } from '../../types/labels'
import type { Quadrant, Task } from '../../types/task'
import { QUADRANT_CELLS } from './quadrant'

const PANEL: Record<Quadrant, { dot: string; tint: string; ink: string }> = {
  DO_FIRST: { dot: 'bg-do-first', tint: 'bg-accent/10', ink: 'text-accent-hover dark:text-accent' },
  SCHEDULE: { dot: 'bg-schedule', tint: 'bg-primary-tint', ink: 'text-primary-deep' },
  DELEGATE: { dot: 'bg-delegate', tint: 'bg-delegate/12', ink: 'text-delegate' },
  DROP: { dot: 'bg-drop', tint: 'bg-line-soft', ink: 'text-muted' },
}

interface TaskMatrixProps {
  tasks: Task[]
  onSelect: (task: Task) => void
}

/**
 * The same two axes as the selector, read as a board: urgency left to right, importance top
 * to bottom. QUADRANT_CELLS is already in that order, so the grid needs no separate layout table.
 */
export function TaskMatrix({ tasks, onSelect }: TaskMatrixProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {QUADRANT_CELLS.map(({ quadrant }) => (
        <Panel
          key={quadrant}
          quadrant={quadrant}
          tasks={tasks.filter((task) => task.quadrant === quadrant)}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}

function Panel({
  quadrant,
  tasks,
  onSelect,
}: {
  quadrant: Quadrant
  tasks: Task[]
  onSelect: (task: Task) => void
}) {
  const style = PANEL[quadrant]

  return (
    <section
      className="flex min-h-[250px] flex-col overflow-hidden rounded-card border border-line
                 bg-surface shadow-[0_1px_2px_rgb(14_95_97/0.05)]"
    >
      <header className={`flex items-center gap-3 border-b border-line px-5 py-4 ${style.tint}`}>
        <span className={`size-2.5 shrink-0 rounded-pill ${style.dot}`} />
        <h2 className={`text-body font-semibold ${style.ink}`}>{QUADRANT_LABELS[quadrant]}</h2>
        <span className="hidden text-xs text-muted sm:inline">{QUADRANT_AXES[quadrant]}</span>
        <span
          className={`ml-auto rounded-pill border border-line bg-raised px-2.5 py-1 text-xs
                      font-semibold ${style.ink}`}
        >
          {tasks.length}
        </span>
      </header>

      {tasks.length === 0 ? (
        <p className="flex flex-1 items-center justify-center px-5 py-8 text-center text-xs text-faint">
          Nothing here
        </p>
      ) : (
        <ul className="flex flex-1 flex-col divide-y divide-line">
          {tasks.map((task) => (
            <li key={task.id}>
              <button
                type="button"
                onClick={() => onSelect(task)}
                className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors
                           hover:bg-primary-tint/50 focus-visible:outline-2
                           focus-visible:-outline-offset-2 focus-visible:outline-primary"
              >
                <span className="min-w-0 flex-1 truncate text-secondary text-ink">
                  {task.title}
                </span>
                <StatusBadge status={task.status} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

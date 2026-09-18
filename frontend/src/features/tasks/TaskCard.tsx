import { formatRelative } from '../../api'
import { QuadrantBadge, StatusBadge } from '../../components/ui'
import { QUADRANT_AXES } from '../../types/labels'
import type { Task } from '../../types/task'

interface TaskCardProps {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
}

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  return (
    <li
      className="group flex flex-col gap-4 rounded-card border border-line bg-surface px-5 py-5
                 shadow-[0_1px_2px_rgb(14_95_97/0.04)] transition-colors hover:border-primary/40
                 sm:flex-row sm:items-start sm:gap-5 sm:px-6"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p className="truncate text-body font-medium text-ink">{task.title}</p>
        {task.description ? (
          <p className="line-clamp-2 text-secondary text-muted">{task.description}</p>
        ) : null}
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <QuadrantBadge quadrant={task.quadrant} />
          <span className="text-xs text-muted">{QUADRANT_AXES[task.quadrant]}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:flex-nowrap sm:gap-5">
        <StatusBadge status={task.status} />
        <span className="text-xs whitespace-nowrap text-muted">
          {task.completedAt
            ? `Done ${formatRelative(task.completedAt)}`
            : `Updated ${formatRelative(task.updatedAt)}`}
        </span>
        {/* visible on hover for pointers, always visible on touch where hover does not exist */}
        <div className="flex gap-2 opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
          <RowAction label="Edit" onClick={() => onEdit(task)} />
          <RowAction label="Delete" onClick={() => onDelete(task)} danger />
        </div>
      </div>
    </li>
  )
}

function RowAction({
  label,
  onClick,
  danger = false,
}: {
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border border-line bg-raised px-3 py-1.5 text-xs font-semibold
                  transition-colors focus-visible:outline-2 focus-visible:outline-offset-2
                  focus-visible:outline-primary ${
                    danger
                      ? 'text-danger hover:border-danger hover:bg-danger-tint/40'
                      : 'text-muted hover:border-primary hover:text-primary'
                  }`}
    >
      {label}
    </button>
  )
}

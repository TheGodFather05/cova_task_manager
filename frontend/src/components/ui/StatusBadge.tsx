import { STATUS_LABELS } from '../../types/labels'
import type { TaskStatus } from '../../types/task'

const STYLES: Record<TaskStatus, string> = {
  TODO: 'bg-line-soft text-muted',
  IN_PROGRESS: 'bg-accent/15 text-accent-ink',
  DONE: 'bg-primary-tint text-primary-deep',
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold ${STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  )
}

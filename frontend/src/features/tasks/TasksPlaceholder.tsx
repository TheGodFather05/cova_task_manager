import { useToast } from '../../components/toast/useToast'

/** Replaced by the real list in F7. */
export function TasksPlaceholder() {
  const { notify } = useToast()

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-display font-semibold text-ink">Tasks</h1>
      <p className="text-body text-muted">The task list arrives in the next step.</p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => notify({ title: 'Task saved', detail: '"Migrate billing service" updated.' })}
          className="rounded-control bg-primary px-4 py-2.5 text-secondary font-semibold text-on-primary hover:bg-primary-deep"
        >
          Preview success toast
        </button>
        <button
          type="button"
          onClick={() =>
            notify({ tone: 'error', title: "Couldn't save task", detail: 'Network error — try again.' })
          }
          className="rounded-control border border-line bg-surface px-4 py-2.5 text-secondary font-medium text-muted hover:border-primary hover:text-primary"
        >
          Preview error toast
        </button>
      </div>
    </div>
  )
}

export type TaskView = 'list' | 'matrix'

interface ViewToggleProps {
  view: TaskView
  onChange: (view: TaskView) => void
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="Task view"
      className="flex gap-1 rounded-control border border-line bg-surface p-1"
    >
      {(['list', 'matrix'] as TaskView[]).map((value) => (
        <button
          key={value}
          type="button"
          role="tab"
          aria-selected={view === value}
          onClick={() => onChange(value)}
          className={`rounded-lg px-4 py-1.5 text-[13px] font-semibold capitalize transition-colors
                      focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                        view === value
                          ? 'bg-primary text-on-primary'
                          : 'text-muted hover:text-primary'
                      }`}
        >
          {value}
        </button>
      ))}
    </div>
  )
}

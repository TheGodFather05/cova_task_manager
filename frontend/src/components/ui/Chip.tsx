interface ChipProps {
  label: string
  active: boolean
  onClick: () => void
}

/** Filter pill from the kit: teal when active, outlined otherwise. */
export function Chip({ label, active, onClick }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 rounded-pill px-4 py-2 text-[13px] font-semibold transition-colors
                  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                    active
                      ? 'bg-primary text-on-primary'
                      : 'border border-line bg-surface text-muted hover:border-primary hover:text-primary'
                  }`}
    >
      {label}
    </button>
  )
}

interface PaginationProps {
  page: number
  totalPages: number
  totalElements: number
  rangeStart: number
  rangeEnd: number
  onPage: (page: number) => void
}

export function Pagination({
  page,
  totalPages,
  totalElements,
  rangeStart,
  rangeEnd,
  onPage,
}: PaginationProps) {
  if (totalElements === 0) {
    return null
  }

  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-xs text-muted">
        Showing {rangeStart}–{rangeEnd} of {totalElements} {totalElements === 1 ? 'task' : 'tasks'}
      </p>
      {totalPages > 1 ? (
        <nav className="flex items-center gap-1.5" aria-label="Pagination">
          <PageButton label="Previous" disabled={page === 0} onClick={() => onPage(page - 1)} />
          {Array.from({ length: totalPages }, (_, index) => (
            <PageButton
              key={index}
              label={String(index + 1)}
              active={index === page}
              onClick={() => onPage(index)}
            />
          ))}
          <PageButton
            label="Next"
            disabled={page >= totalPages - 1}
            onClick={() => onPage(page + 1)}
          />
        </nav>
      ) : null}
    </div>
  )
}

function PageButton({
  label,
  onClick,
  active = false,
  disabled = false,
}: {
  label: string
  onClick: () => void
  active?: boolean
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-current={active ? 'page' : undefined}
      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors
                  disabled:cursor-not-allowed disabled:opacity-40 ${
                    active
                      ? 'bg-primary text-on-primary'
                      : 'border border-line bg-surface text-muted hover:border-primary hover:text-primary'
                  }`}
    >
      {label}
    </button>
  )
}

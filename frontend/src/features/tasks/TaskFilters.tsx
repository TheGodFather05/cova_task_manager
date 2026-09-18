import { Chip } from '../../components/ui'
import { QUADRANT_LABELS, STATUS_LABELS } from '../../types/labels'
import { QUADRANTS, TASK_STATUSES, type Quadrant, type TaskStatus } from '../../types/task'

interface TaskFiltersProps {
  status?: TaskStatus
  quadrant?: Quadrant
  searchDraft: string
  onSearch: (value: string) => void
  onStatus: (value?: TaskStatus) => void
  onQuadrant: (value?: Quadrant) => void
  showQuadrants?: boolean
}

export function TaskFilters({
  status,
  quadrant,
  searchDraft,
  onSearch,
  onStatus,
  onQuadrant,
  showQuadrants = true,
}: TaskFiltersProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
          <Chip label="All" active={!status} onClick={() => onStatus(undefined)} />
          {TASK_STATUSES.map((value) => (
            <Chip
              key={value}
              label={STATUS_LABELS[value]}
              active={status === value}
              onClick={() => onStatus(status === value ? undefined : value)}
            />
          ))}
        </div>
        <label className="sm:w-[320px]">
          <span className="sr-only">Search tasks</span>
          <input
            type="search"
            value={searchDraft}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search tasks"
            className="w-full rounded-control border border-line bg-raised px-3.5 py-2.5
                       text-secondary text-ink transition-colors outline-none
                       placeholder:text-faint focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
      </div>

      {showQuadrants ? (
      <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
        <Chip label="Any priority" active={!quadrant} onClick={() => onQuadrant(undefined)} />
        {QUADRANTS.map((value) => (
          <Chip
            key={value}
            label={QUADRANT_LABELS[value]}
            active={quadrant === value}
            onClick={() => onQuadrant(quadrant === value ? undefined : value)}
          />
        ))}
      </div>
      ) : null}
    </div>
  )
}

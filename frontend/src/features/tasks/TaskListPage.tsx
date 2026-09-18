import { Alert, Button, EmptyState, SkeletonRows } from '../../components/ui'
import { Pagination } from './Pagination'
import { TaskCard } from './TaskCard'
import { TaskFilters } from './TaskFilters'
import { useTaskFilters } from './useTaskFilters'
import { useTasks } from './useTasks'

export function TaskListPage() {
  const {
    filters,
    page,
    status,
    quadrant,
    searchDraft,
    setSearchDraft,
    setStatus,
    setQuadrant,
    setPage,
    hasFilters,
    clear,
  } = useTaskFilters()
  const { page: result, loading, error, reload } = useTasks(filters)

  const size = filters.size ?? 10
  const rangeStart = (result?.totalElements ?? 0) === 0 ? 0 : page * size + 1
  const rangeEnd = Math.min((page + 1) * size, result?.totalElements ?? 0)

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-display font-semibold text-ink">Tasks</h1>
          <p className="text-secondary text-muted">
            Sorted newest first. Filters and search run on the server.
          </p>
        </div>
        <Button variant="accent">+ New task</Button>
      </header>

      <TaskFilters
        status={status}
        quadrant={quadrant}
        searchDraft={searchDraft}
        onSearch={setSearchDraft}
        onStatus={setStatus}
        onQuadrant={setQuadrant}
      />

      {error ? (
        <div className="flex flex-col items-start gap-3">
          <Alert title={error} detail="Check your connection and retry." />
          <Button variant="secondary" onClick={() => void reload()}>
            Retry
          </Button>
        </div>
      ) : loading && !result ? (
        <SkeletonRows rows={5} />
      ) : result && result.content.length > 0 ? (
        <>
          <ul
            className={`flex flex-col gap-2.5 transition-opacity ${loading ? 'opacity-60' : ''}`}
          >
            {result.content.map((task) => (
              <TaskCard key={task.id} task={task} onEdit={() => {}} onDelete={() => {}} />
            ))}
          </ul>
          <Pagination
            page={page}
            totalPages={result.totalPages}
            totalElements={result.totalElements}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            onPage={setPage}
          />
        </>
      ) : hasFilters ? (
        <EmptyState
          title="No matching tasks"
          description="No task matches these filters. Try widening them."
          action={
            <Button variant="secondary" onClick={clear}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <EmptyState
          title="No tasks yet"
          description="Everything you are working on will show up here. Start with the first one."
          action={<Button variant="accent">Create your first task</Button>}
        />
      )}
    </div>
  )
}

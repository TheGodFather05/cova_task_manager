import { useState } from 'react'
import { HttpError, taskApi } from '../../api'
import { Alert, Button, ConfirmDialog, EmptyState, SkeletonRows } from '../../components/ui'
import { useToast } from '../../components/toast/useToast'
import type { Task } from '../../types/task'
import { TaskForm } from './TaskForm'
import { TaskMatrix } from './TaskMatrix'
import { ViewToggle } from './ViewToggle'
import { Pagination } from './Pagination'
import { TaskCard } from './TaskCard'
import { TaskFilters } from './TaskFilters'
import { useTaskFilters } from './useTaskFilters'
import { useTasks } from './useTasks'

export function TaskListPage() {
  const {
    filters,
    view,
    setView,
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
  const { notify } = useToast()
  const [editing, setEditing] = useState<Task | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<Task | null>(null)
  const [deletePending, setDeletePending] = useState(false)

  async function confirmDelete() {
    if (!deleting) {
      return
    }
    setDeletePending(true)
    try {
      await taskApi.remove(deleting.id)
      notify({ title: 'Task deleted', detail: `“${deleting.title}” removed.` })
      setDeleting(null)
      await reload()
    } catch (caught) {
      const gone = caught instanceof HttpError && caught.status === 404
      notify({
        tone: 'error',
        title: "Couldn't delete task",
        detail: gone ? 'It no longer exists.' : 'Network error — try again.',
      })
      if (gone) {
        setDeleting(null)
        await reload()
      }
    } finally {
      setDeletePending(false)
    }
  }

  const size = filters.size ?? 10
  const rangeStart = (result?.totalElements ?? 0) === 0 ? 0 : page * size + 1
  const rangeEnd = Math.min((page + 1) * size, result?.totalElements ?? 0)

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-display font-semibold text-ink">Tasks</h1>
          <p className="text-secondary text-muted">
            {view === 'matrix'
              ? 'Urgency left to right, importance top to bottom.'
              : 'Sorted newest first. Filters and search run on the server.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ViewToggle view={view} onChange={setView} />
          <Button variant="accent" onClick={() => setCreating(true)}>
            + New task
          </Button>
        </div>
      </header>

      <TaskFilters
        status={status}
        quadrant={quadrant}
        searchDraft={searchDraft}
        onSearch={setSearchDraft}
        onStatus={setStatus}
        onQuadrant={setQuadrant}
        showQuadrants={view === 'list'}
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
        view === 'matrix' ? (
          <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
            <TaskMatrix tasks={result.content} onSelect={setEditing} />
          </div>
        ) : (
        <>
          <ul
            className={`flex flex-col gap-2.5 transition-opacity ${loading ? 'opacity-60' : ''}`}
          >
            {result.content.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={setEditing}
                onDelete={setDeleting}
              />
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
        )
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
          action={
            <Button variant="accent" onClick={() => setCreating(true)}>
              Create your first task
            </Button>
          }
        />
      )}

      {creating || editing ? (
        <TaskForm
          // remount on target change so the form state starts from the right task
          key={editing?.id ?? 'new'}
          open
          task={editing}
          onClose={() => {
            setCreating(false)
            setEditing(null)
          }}
          onSaved={() => {
            setCreating(false)
            setEditing(null)
            void reload()
          }}
        />
      ) : null}

      <ConfirmDialog
        open={deleting !== null}
        title="Delete this task?"
        description={`“${deleting?.title ?? ''}” will be removed. This can’t be undone.`}
        confirmLabel="Delete task"
        pending={deletePending}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}

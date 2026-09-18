import { useCallback, useEffect, useRef, useState } from 'react'
import { taskApi } from '../../api'
import type { Page, Task, TaskFilters } from '../../types/task'

interface TasksState {
  page: Page<Task> | null
  loading: boolean
  error: string | null
}

/**
 * Filtering, search and pagination all run server-side — the browser never receives the
 * whole list and narrows it down locally, which stops working at a few thousand tasks.
 */
export function useTasks(filters: TaskFilters) {
  const [state, setState] = useState<TasksState>({ page: null, loading: true, error: null })

  // guards against a slow earlier response overwriting a newer one
  const requestId = useRef(0)

  const { page, size, status, importance, urgency, quadrant, search } = filters

  const load = useCallback(async () => {
    const id = ++requestId.current
    setState((current) => ({ ...current, loading: true, error: null }))
    try {
      const result = await taskApi.list({ page, size, status, importance, urgency, quadrant, search })
      if (id === requestId.current) {
        setState({ page: result, loading: false, error: null })
      }
    } catch {
      if (id === requestId.current) {
        setState({ page: null, loading: false, error: "Couldn't load tasks" })
      }
    }
  }, [page, size, status, importance, urgency, quadrant, search])

  // fetching is synchronising with an external system, which is what effects are for
  useEffect(() => {
    void load()
  }, [load])

  return { ...state, reload: load }
}

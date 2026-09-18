import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Quadrant, TaskFilters, TaskStatus } from '../../types/task'
import type { TaskView } from './ViewToggle'

const PAGE_SIZE = 10
// the matrix shows every quadrant at once, so it asks for a larger slice than the list
const MATRIX_SIZE = 100
const SEARCH_DEBOUNCE_MS = 300

/**
 * Filters live in the URL, not in component state: a filtered view is shareable, survives a
 * reload, and the Back button behaves. The raw search box stays local so typing is never laggy.
 */
export function useTaskFilters() {
  const [params, setParams] = useSearchParams()
  const [searchDraft, setSearchDraft] = useState(() => params.get('search') ?? '')

  const view: TaskView = params.get('view') === 'matrix' ? 'matrix' : 'list'
  const page = Number(params.get('page') ?? '0')
  const status = (params.get('status') as TaskStatus | null) ?? undefined
  const quadrant = (params.get('quadrant') as Quadrant | null) ?? undefined
  const search = params.get('search') ?? undefined

  // debounce the committed value, not the input, so the field stays responsive
  useEffect(() => {
    const current = params.get('search') ?? ''
    if (searchDraft === current) {
      return
    }
    const timer = setTimeout(() => {
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous)
          if (searchDraft) {
            next.set('search', searchDraft)
          } else {
            next.delete('search')
          }
          next.delete('page')
          return next
        },
        { replace: true },
      )
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchDraft, params, setParams])

  const update = useCallback(
    (changes: Record<string, string | undefined>, resetPage = true) => {
      setParams((previous) => {
        const next = new URLSearchParams(previous)
        for (const [name, value] of Object.entries(changes)) {
          if (value) {
            next.set(name, value)
          } else {
            next.delete(name)
          }
        }
        // a filter change with a stale page lands on page 5 of a 2-page result
        if (resetPage) {
          next.delete('page')
        }
        return next
      })
    },
    [setParams],
  )

  const filters = useMemo<TaskFilters>(
    () =>
      view === 'matrix'
        ? { page: 0, size: MATRIX_SIZE, status, search }
        : { page, size: PAGE_SIZE, status, quadrant, search },
    [view, page, status, quadrant, search],
  )

  return {
    filters,
    view,
    setView: (value: TaskView) => update({ view: value === 'matrix' ? 'matrix' : undefined }),
    page,
    status,
    quadrant,
    searchDraft,
    setSearchDraft,
    setStatus: (value?: TaskStatus) => update({ status: value }),
    setQuadrant: (value?: Quadrant) => update({ quadrant: value }),
    setPage: (value: number) => update({ page: value > 0 ? String(value) : undefined }, false),
    hasFilters: Boolean(status ?? quadrant ?? search),
    clear: () => update({ status: undefined, quadrant: undefined, search: undefined }),
  }
}

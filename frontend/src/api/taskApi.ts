import type { Page, Task, TaskFilters, TaskInput, TaskStatus } from '../types/task'
import { api } from './client'

const BASE = '/api/tasks'

export const taskApi = {
  list(filters: TaskFilters = {}, signal?: AbortSignal): Promise<Page<Task>> {
    return api.get<Page<Task>>(BASE, { ...filters }, signal)
  },

  get(id: number): Promise<Task> {
    return api.get<Task>(`${BASE}/${id}`)
  },

  create(input: TaskInput): Promise<Task> {
    return api.post<Task>(BASE, input)
  },

  update(id: number, input: TaskInput): Promise<Task> {
    return api.put<Task>(`${BASE}/${id}`, input)
  },

  remove(id: number): Promise<void> {
    return api.delete<void>(`${BASE}/${id}`)
  },

  /**
   * The API has no status-count endpoint, so the funnel reads totalElements from a
   * one-row page per status rather than counting a fully loaded list in the browser.
   */
  async countByStatus(status: TaskStatus, signal?: AbortSignal): Promise<number> {
    const page = await api.get<Page<Task>>(BASE, { status, size: 1 }, signal)
    return page.totalElements
  },
}

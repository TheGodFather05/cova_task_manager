export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'
export type Importance = 'IMPORTANT' | 'NOT_IMPORTANT'
export type Urgency = 'URGENT' | 'NOT_URGENT'
export type Quadrant = 'DO_FIRST' | 'SCHEDULE' | 'DELEGATE' | 'DROP'

export const TASK_STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE']
export const QUADRANTS: Quadrant[] = ['DO_FIRST', 'SCHEDULE', 'DELEGATE', 'DROP']

/** Mirrors TaskResponse. Timestamps are UTC wall-clock strings without an offset. */
export interface Task {
  id: number
  title: string
  description: string | null
  status: TaskStatus
  importance: Importance
  urgency: Urgency
  quadrant: Quadrant
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

/** Mirrors TaskRequest. No quadrant field: it is derived and never accepted on write. */
export interface TaskInput {
  title: string
  description?: string | null
  status: TaskStatus
  importance: Importance
  urgency: Urgency
}

export interface TaskFilters {
  page?: number
  size?: number
  status?: TaskStatus
  importance?: Importance
  urgency?: Urgency
  quadrant?: Quadrant
  search?: string
}

/** Spring Data page envelope, narrowed to the fields the UI reads. */
export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

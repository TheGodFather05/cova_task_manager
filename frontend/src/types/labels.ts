import type { Quadrant, TaskStatus } from './task'

export const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
}

export const QUADRANT_LABELS: Record<Quadrant, string> = {
  DO_FIRST: 'Do first',
  SCHEDULE: 'Schedule',
  DELEGATE: 'Delegate',
  DROP: 'Drop',
}

/** The two axes each quadrant stands for, shown beside the badge and in the 2x2 grid. */
export const QUADRANT_AXES: Record<Quadrant, string> = {
  DO_FIRST: 'Important · Urgent',
  SCHEDULE: 'Important · Not urgent',
  DELEGATE: 'Not important · Urgent',
  DROP: 'Not important · Not urgent',
}

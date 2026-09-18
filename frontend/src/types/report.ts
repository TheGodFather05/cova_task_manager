import type { Quadrant } from './task'

export type Period = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
export type BucketUnit = 'HOURS' | 'DAYS' | 'MONTHS'

export const PERIODS: Period[] = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']

/** The heatmap only carries meaning over a long span; the kit gates it to these periods. */
export const HEATMAP_PERIODS: Period[] = ['MONTHLY', 'YEARLY']

/**
 * null means undefined, not zero: the backend refuses to state a rate when the denominator
 * is zero. Rendering 0% would claim a fact the API declined to make.
 */
export interface SummaryTotals {
  tasksCreated: number
  tasksCompleted: number
  completionRate: number | null
}

export interface SummaryDelta {
  tasksCreated: number
  tasksCreatedPercent: number | null
  tasksCompleted: number
  tasksCompletedPercent: number | null
  /** percentage points, not a percent change */
  completionRatePoints: number | null
}

export interface SummaryReport {
  period: Period
  zone: string
  start: string
  end: string
  /** false whenever the period is still running, which is the normal case */
  currentPeriodComplete: boolean
  current: SummaryTotals
  previous: SummaryTotals
  delta: SummaryDelta
}

export interface TrendPoint {
  bucket: string
  count: number
}

export interface TrendReport {
  period: Period
  zone: string
  /** drives the axis label format; comes from the response, not from the period */
  bucketUnit: BucketUnit
  start: string
  end: string
  points: TrendPoint[]
}

export interface QuadrantCount {
  quadrant: Quadrant
  count: number
  /** share of the total, not a bar height */
  percentage: number
}

/**
 * Serialized with NON_NULL, so the period fields are absent on /distribution and asOf is
 * absent on /quadrants. Marking them optional keeps the type honest.
 */
export interface QuadrantReport {
  period?: Period
  zone?: string
  start?: string
  end?: string
  asOf?: string
  total: number
  quadrants: QuadrantCount[]
}

export interface HeatmapDay {
  date: string
  count: number
}

export interface HeatmapReport {
  year: number
  zone: string
  maxCount: number
  totalCompleted: number
  days: HeatmapDay[]
}

export interface StatusCounts {
  TODO: number
  IN_PROGRESS: number
  DONE: number
}

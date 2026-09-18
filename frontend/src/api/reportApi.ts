import type {
  HeatmapReport,
  Period,
  QuadrantReport,
  StatusCounts,
  SummaryReport,
  TrendReport,
} from '../types/report'
import { api } from './client'
import { currentZone } from './datetime'
import { taskApi } from './taskApi'

const BASE = '/api/reports'

export const reportApi = {
  summary(period: Period, signal?: AbortSignal): Promise<SummaryReport> {
    return api.get<SummaryReport>(`${BASE}/summary`, { period, zone: currentZone() }, signal)
  },

  trend(period: Period, signal?: AbortSignal): Promise<TrendReport> {
    return api.get<TrendReport>(`${BASE}/trend`, { period, zone: currentZone() }, signal)
  },

  quadrants(period: Period, signal?: AbortSignal): Promise<QuadrantReport> {
    return api.get<QuadrantReport>(`${BASE}/quadrants`, { period, zone: currentZone() }, signal)
  },

  /** Open tasks as of now: takes no period and no zone. */
  distribution(signal?: AbortSignal): Promise<QuadrantReport> {
    return api.get<QuadrantReport>(`${BASE}/distribution`, undefined, signal)
  },

  heatmap(year: number, signal?: AbortSignal): Promise<HeatmapReport> {
    return api.get<HeatmapReport>(`${BASE}/heatmap`, { year, zone: currentZone() }, signal)
  },

  async statusCounts(signal?: AbortSignal): Promise<StatusCounts> {
    const [todo, inProgress, done] = await Promise.all([
      taskApi.countByStatus('TODO', signal),
      taskApi.countByStatus('IN_PROGRESS', signal),
      taskApi.countByStatus('DONE', signal),
    ])
    return { TODO: todo, IN_PROGRESS: inProgress, DONE: done }
  },
}

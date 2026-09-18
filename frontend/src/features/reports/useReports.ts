import { useCallback, useEffect, useRef, useState } from 'react'
import { reportApi } from '../../api'
import type {
  HeatmapReport,
  Period,
  QuadrantReport,
  StatusCounts,
  SummaryReport,
  TrendReport,
} from '../../types/report'
import { HEATMAP_PERIODS } from '../../types/report'

export interface ReportsData {
  summary: SummaryReport
  trend: TrendReport
  quadrants: QuadrantReport
  distribution: QuadrantReport
  statusCounts: StatusCounts
  heatmap: HeatmapReport | null
}

interface ReportsState {
  data: ReportsData | null
  loading: boolean
  error: string | null
}

/**
 * Every source is independent, so they all go out at once rather than in sequence — five
 * report endpoints plus three one-row task pages for the status counts. Waterfalling these
 * would make the dashboard feel several times slower for no reason.
 */
export function useReports(period: Period, year: number) {
  const [state, setState] = useState<ReportsState>({ data: null, loading: true, error: null })
  const requestId = useRef(0)

  const load = useCallback(async () => {
    const id = ++requestId.current
    setState((current) => ({ ...current, loading: true, error: null }))

    try {
      const wantsHeatmap = HEATMAP_PERIODS.includes(period)
      const [summary, trend, quadrants, distribution, statusCounts, heatmap] = await Promise.all([
        reportApi.summary(period),
        reportApi.trend(period),
        reportApi.quadrants(period),
        reportApi.distribution(),
        reportApi.statusCounts(),
        wantsHeatmap ? reportApi.heatmap(year) : Promise.resolve(null),
      ])

      if (id === requestId.current) {
        setState({
          data: { summary, trend, quadrants, distribution, statusCounts, heatmap },
          loading: false,
          error: null,
        })
      }
    } catch {
      if (id === requestId.current) {
        setState({ data: null, loading: false, error: "Couldn't load reports" })
      }
    }
  }, [period, year])

  useEffect(() => {
    void load()
  }, [load])

  return { ...state, reload: load }
}

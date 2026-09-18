import { useState } from 'react'
import { currentZone, parseUtc } from '../../api'
import { Alert, Button, Skeleton } from '../../components/ui'
import type { BucketUnit, Period, TrendReport } from '../../types/report'
import {
  ChartCard,
  Heatmap,
  QuadrantBars,
  QuadrantDonut,
  StatusBars,
  TrendChart,
  type TrendDatum,
} from './charts'
import { MetricCard } from './MetricCard'
import { PeriodSelector } from './PeriodSelector'
import { useReports } from './useReports'

export function ReportsPage() {
  const [period, setPeriod] = useState<Period>('WEEKLY')
  const year = new Date().getFullYear()
  const { data, loading, error, reload } = useReports(period, year)

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-display font-semibold text-ink">Reports</h1>
          <p className="text-secondary text-muted">
            {data ? formatRange(data.summary.start, data.summary.end, period) : 'Loading…'}
          </p>
        </div>
        <PeriodSelector period={period} onChange={setPeriod} />
      </header>

      {error ? (
        <div className="flex flex-col items-start gap-3">
          <Alert title={error} detail="Check your connection and retry." />
          <Button variant="secondary" onClick={() => void reload()}>
            Retry
          </Button>
        </div>
      ) : !data ? (
        <ReportsSkeleton />
      ) : (
        <div className={`flex flex-col gap-4 ${loading ? 'opacity-60 transition-opacity' : ''}`}>
          {!data.summary.currentPeriodComplete ? (
            <p className="text-xs text-muted">
              This period is still in progress, so it is compared against a complete one.
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Created"
              value={data.summary.current.tasksCreated}
              delta={data.summary.delta.tasksCreatedPercent}
              deltaSuffix="%"
              note="vs previous"
            />
            <MetricCard
              label="Completed"
              value={data.summary.current.tasksCompleted}
              delta={data.summary.delta.tasksCompletedPercent}
              deltaSuffix="%"
              note="vs previous"
            />
            <MetricCard
              label="Completion rate"
              value={data.summary.current.completionRate}
              suffix="%"
              delta={data.summary.delta.completionRatePoints}
              deltaSuffix=" pts"
              note="percentage points"
            />
            <MetricCard
              label="Open now"
              value={data.distribution.total}
              delta={null}
              note="across all quadrants"
            />
          </div>

          {/* one per screen on a phone, scroll-snapped; a grid from md up */}
          <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 md:pb-0 [&>*]:w-[86vw] [&>*]:shrink-0 [&>*]:snap-center md:[&>*]:w-auto">
            <ChartCard title="Completion trend" caption={trendCaption(data.trend)}>
              <TrendChart data={toTrendData(data.trend)} />
            </ChartCard>

            <ChartCard
              title="Completed work by quadrant"
              caption="Where the period actually went"
            >
              <QuadrantBars quadrants={data.quadrants.quadrants} total={data.quadrants.total} />
            </ChartCard>

            <ChartCard title="Open tasks by quadrant" caption="As of now, across every period">
              <QuadrantDonut
                quadrants={data.distribution.quadrants}
                total={data.distribution.total}
              />
            </ChartCard>

            <ChartCard title="Tasks by status" caption="Disjoint sets, not funnel stages">
              <StatusBars counts={data.statusCounts} />
            </ChartCard>
          </div>

          {data.heatmap ? (
            <ChartCard
              title="Activity heatmap"
              caption={`${data.heatmap.totalCompleted} completed in ${data.heatmap.year}`}
            >
              <Heatmap
                days={data.heatmap.days}
                maxCount={data.heatmap.maxCount}
                totalCompleted={data.heatmap.totalCompleted}
              />
            </ChartCard>
          ) : (
            <p className="text-xs text-muted">
              Activity heatmap appears for monthly and yearly periods.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

/** The step comes from bucketUnit in the response, not from the period we asked for. */
function toTrendData(trend: TrendReport): TrendDatum[] {
  return trend.points.map((point) => ({
    label: formatBucket(point.bucket, trend.bucketUnit),
    count: point.count,
  }))
}

function formatBucket(bucket: string, unit: BucketUnit): string {
  const date = parseUtc(bucket)
  const zone = currentZone()
  if (unit === 'HOURS') {
    return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', timeZone: zone })
      .format(date)
  }
  if (unit === 'MONTHS') {
    return new Intl.DateTimeFormat(undefined, { month: 'short', timeZone: zone }).format(date)
  }
  return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', timeZone: zone })
    .format(date)
}

function trendCaption(trend: TrendReport): string {
  const peak = Math.max(...trend.points.map((point) => point.count), 0)
  const step = trend.bucketUnit.toLowerCase().replace(/s$/, '')
  return `Completed per ${step} · peak ${peak}`
}

function formatRange(start: string, end: string, period: Period): string {
  const zone = currentZone()
  const from = parseUtc(start)
  // the end bound is exclusive, so show the last moment inside the period
  const to = new Date(parseUtc(end).getTime() - 1)

  if (period === 'DAILY') {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'full', timeZone: zone }).format(from)
  }
  if (period === 'YEARLY') {
    return new Intl.DateTimeFormat(undefined, { year: 'numeric', timeZone: zone }).format(from)
  }
  if (period === 'MONTHLY') {
    return new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric', timeZone: zone })
      .format(from)
  }
  const formatter = new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: zone,
  })
  return `${formatter.format(from)} – ${formatter.format(to)}`
}

function ReportsSkeleton() {
  return (
    <div className="flex flex-col gap-4" role="status" aria-label="Loading reports">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="flex flex-col gap-3 rounded-card border border-line bg-surface p-5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="flex flex-col gap-4 rounded-card border border-line bg-surface p-6">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-[160px] w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

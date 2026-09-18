import {
  ChartCard,
  Heatmap,
  QuadrantBars,
  QuadrantDonut,
  StatusBars,
  TrendChart,
} from '../reports/charts'
import {
  HEATMAP_EMPTY,
  HEATMAP_NORMAL,
  QUADRANTS_EMPTY,
  QUADRANTS_EQUAL,
  QUADRANTS_NORMAL,
  STATUS_EMPTY,
  STATUS_NORMAL,
  TREND_ALL_ZERO,
  TREND_HOURLY,
  TREND_NORMAL,
  TREND_SINGLE,
} from '../reports/fixtures'

const total = (entries: { count: number }[]) => entries.reduce((sum, e) => sum + e.count, 0)

/**
 * Dev-only. Every chart is shown against real-shaped data AND against the degenerate data a
 * new account actually produces, so the broken cases are visible before users find them.
 */
export function ChartPreview() {
  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-display font-semibold text-ink">Chart preview</h1>
        <p className="text-secondary text-muted">
          Left column: ordinary data. Right column: the degenerate cases.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Completion trend" caption="Seven days, peak 11">
          <TrendChart data={TREND_NORMAL} />
        </ChartCard>
        <ChartCard title="Trend — all zero" caption="A week with nothing completed">
          <TrendChart data={TREND_ALL_ZERO} />
        </ChartCard>

        <ChartCard title="Trend — hourly" caption="24 buckets, mostly empty (a typical day)">
          <TrendChart data={TREND_HOURLY} />
        </ChartCard>
        <ChartCard title="Trend — single point" caption="One bucket only">
          <TrendChart data={TREND_SINGLE} />
        </ChartCard>

        <ChartCard title="Open by quadrant" caption="Donut with an empty slice">
          <QuadrantDonut quadrants={QUADRANTS_NORMAL} total={total(QUADRANTS_NORMAL)} />
        </ChartCard>
        <ChartCard title="Donut — nothing open" caption="Must not render a solid ring">
          <QuadrantDonut quadrants={QUADRANTS_EMPTY} total={0} />
        </ChartCard>

        <ChartCard title="Completed by quadrant" caption="Heights scale to the tallest bar">
          <QuadrantBars quadrants={QUADRANTS_NORMAL} total={total(QUADRANTS_NORMAL)} />
        </ChartCard>
        <ChartCard title="Bars — four equal" caption="All four must be full height, not quarters">
          <QuadrantBars quadrants={QUADRANTS_EQUAL} total={total(QUADRANTS_EQUAL)} />
        </ChartCard>

        <ChartCard title="Tasks by status" caption="Disjoint sets, not funnel stages">
          <StatusBars counts={STATUS_NORMAL} />
        </ChartCard>
        <ChartCard title="Status — no tasks" caption="A brand-new account">
          <StatusBars counts={STATUS_EMPTY} />
        </ChartCard>
      </div>

      <ChartCard title="Activity heatmap" caption="2026, padded to start on the right weekday">
        <Heatmap days={HEATMAP_NORMAL} maxCount={7} totalCompleted={520} />
      </ChartCard>

      <ChartCard title="Heatmap — empty year" caption="365 zero days must not read as broken">
        <Heatmap days={HEATMAP_EMPTY} maxCount={0} totalCompleted={0} />
      </ChartCard>
    </div>
  )
}

import { useState } from 'react'
import { VIEW_HEIGHT, VIEW_WIDTH, toAreaPolygon, toPoints, toPolyline } from '../chartMath'

export interface TrendDatum {
  label: string
  count: number
}

interface TrendChartProps {
  data: TrendDatum[]
  /** marks the in-flight bucket of a period that has not finished yet */
  incompleteFrom?: number
}

export function TrendChart({ data, incompleteFrom }: TrendChartProps) {
  const [hovered, setHovered] = useState<number | null>(null)
  const counts = data.map((point) => point.count)
  const points = toPoints(counts)
  const peak = Math.max(...counts, 0)

  if (data.length === 0) {
    return null
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <svg
          viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
          preserveAspectRatio="none"
          className="block h-[180px] w-full"
          role="img"
          aria-label={`Completion trend, peak ${peak}`}
        >
          <polygon points={toAreaPolygon(counts)} className="fill-primary/15" />
          <polyline
            points={toPolyline(counts)}
            fill="none"
            strokeWidth="2"
            // without this the stroke is stretched by preserveAspectRatio="none" and a
            // horizontal segment renders thicker than a vertical one
            vectorEffect="non-scaling-stroke"
            className="stroke-primary"
          />
          {incompleteFrom !== undefined && incompleteFrom < points.length - 1 ? (
            <polyline
              points={toPolyline(counts).split(' ').slice(incompleteFrom).join(' ')}
              fill="none"
              strokeWidth="2"
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
              className="stroke-primary"
            />
          ) : null}
        </svg>

        {/* hover targets and the tooltip are HTML: SVG text would be stretched too */}
        <div className="absolute inset-0 flex">
          {data.map((point, index) => (
            <button
              key={point.label}
              type="button"
              tabIndex={-1}
              aria-hidden
              onMouseEnter={() => setHovered(index)}
              onMouseLeave={() => setHovered(null)}
              className="h-full flex-1 cursor-default"
            />
          ))}
        </div>

        {hovered !== null ? (
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg
                       bg-primary-deep px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-white shadow-lg"
            style={{ left: `${points[hovered].x}%`, top: `${(points[hovered].y / VIEW_HEIGHT) * 100}%` }}
          >
            {data[hovered].label} · {data[hovered].count}
          </div>
        ) : null}
      </div>

      <div className="flex justify-between text-[11px] text-muted">
        {tickLabels(data).map((tick) => (
          <span key={tick.index}>{tick.label}</span>
        ))}
      </div>
    </div>
  )
}

/** Thin the axis to roughly six labels so they never collide on a phone. */
function tickLabels(data: TrendDatum[]) {
  const step = Math.max(1, Math.ceil(data.length / 6))
  return data
    .map((point, index) => ({ index, label: point.label }))
    .filter((tick) => tick.index % step === 0)
}

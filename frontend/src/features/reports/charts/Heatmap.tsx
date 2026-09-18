import type { HeatmapDay } from '../../../types/report'
import { heatIntensity, leadingBlanks } from '../chartMath'

const STEPS = ['bg-heat-0', 'bg-heat-1', 'bg-heat-2', 'bg-heat-3', 'bg-heat-4'] as const
const WEEKDAYS = ['Mon', '', 'Wed', '', 'Fri', '', '']

interface HeatmapProps {
  days: HeatmapDay[]
  maxCount: number
  totalCompleted: number
}

export function Heatmap({ days, maxCount, totalCompleted }: HeatmapProps) {
  if (days.length === 0) {
    return null
  }

  // pad so the first column starts on the right weekday; without this the whole year is
  // rotated and every weekday label is wrong
  const blanks = leadingBlanks(days[0].date)

  return (
    <div className="flex flex-col gap-3">
      {totalCompleted === 0 ? (
        <p className="text-xs text-faint">Nothing completed this year yet.</p>
      ) : null}

      <div className="flex gap-2 overflow-x-auto pb-1">
        <div className="grid shrink-0 grid-rows-7 gap-[3px] pt-[1px] text-[10px] text-muted">
          {WEEKDAYS.map((label, index) => (
            <span key={index} className="flex h-[11px] items-center">
              {label}
            </span>
          ))}
        </div>

        <div className="grid grid-flow-col grid-rows-7 gap-[3px]">
          {Array.from({ length: blanks }, (_, index) => (
            <span key={`blank-${index}`} className="size-[11px]" aria-hidden />
          ))}
          {days.map((day) => (
            <span
              key={day.date}
              title={`${day.date} · ${day.count} completed`}
              className={`size-[11px] rounded-[2px] ${STEPS[heatIntensity(day.count, maxCount)]}`}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-muted">
        <span>Less</span>
        {STEPS.map((step) => (
          <span key={step} className={`size-[11px] rounded-[2px] ${step}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}

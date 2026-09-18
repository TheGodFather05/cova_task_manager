/**
 * The API serializes two different time shapes:
 *
 *   task timestamps   "2026-09-17T18:58:40.935"   LocalDateTime, no offset
 *   report timestamps "2026-09-17T00:00:00Z"      Instant, explicit UTC
 *
 * `new Date("2026-09-17T18:58:40.935")` is parsed as *local* time by the ECMAScript spec,
 * so a bare task timestamp lands wrong by the viewer's UTC offset — an hour out in WAT,
 * a day out near midnight. Both shapes go through parseUtc so they mean the same thing.
 */
export function parseUtc(value: string): Date {
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value)
  return new Date(hasZone ? value : `${value}Z`)
}

/** The viewer's IANA zone, sent to the report endpoints so day boundaries match their calendar. */
export function currentZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
}

export function formatDateTime(value: string, zone = currentZone()): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: zone,
  }).format(parseUtc(value))
}

export function formatDate(value: string, zone = currentZone()): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: zone }).format(
    parseUtc(value),
  )
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 3600_000],
  ['month', 30 * 24 * 3600_000],
  ['week', 7 * 24 * 3600_000],
  ['day', 24 * 3600_000],
  ['hour', 3600_000],
  ['minute', 60_000],
]

export function formatRelative(value: string, now: Date = new Date()): string {
  const elapsed = parseUtc(value).getTime() - now.getTime()
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })

  for (const [unit, ms] of RELATIVE_UNITS) {
    if (Math.abs(elapsed) >= ms) {
      return formatter.format(Math.round(elapsed / ms), unit)
    }
  }
  return formatter.format(0, 'minute')
}

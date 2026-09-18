import { describe, expect, it } from 'vitest'
import {
  formatDelta,
  heatIntensity,
  leadingBlanks,
  percentChange,
  toAreaPolygon,
  toBarHeight,
  toConicStops,
  toPoints,
  toPolyline,
} from './chartMath'

describe('toPoints', () => {
  it('spans the full viewBox width', () => {
    const points = toPoints([1, 2, 3])
    expect(points[0].x).toBe(0)
    expect(points[2].x).toBe(100)
  })

  it('puts the tallest count at the top', () => {
    expect(toPoints([0, 10])[1].y).toBe(0)
  })

  // a new account produces this every time
  it('draws an all-zero series flat along the bottom instead of dividing by zero', () => {
    const points = toPoints([0, 0, 0, 0])
    expect(points.every((point) => point.y === 40)).toBe(true)
    expect(points.every((point) => Number.isFinite(point.x))).toBe(true)
  })

  it('survives a single point without dividing by zero', () => {
    expect(toPoints([5])).toEqual([{ x: 0, y: 0 }])
  })

  it('returns nothing for an empty series', () => {
    expect(toPoints([])).toEqual([])
    expect(toPolyline([])).toBe('')
    expect(toAreaPolygon([])).toBe('')
  })
})

describe('toAreaPolygon', () => {
  it('closes the shape down to the baseline at both ends', () => {
    const polygon = toAreaPolygon([1, 5, 2]).split(' ')
    expect(polygon[0]).toBe('0.00,40.00')
    expect(polygon[polygon.length - 1]).toBe('100.00,40.00')
  })
})

describe('toConicStops', () => {
  it('builds cumulative stops that reach 100%', () => {
    const stops = toConicStops([
      { color: '#a', value: 1 },
      { color: '#b', value: 3 },
    ])
    expect(stops).toContain('#a 0.00% 25.00%')
    expect(stops).toContain('#b 25.00% 100.00%')
  })

  // otherwise four zero-width stops render as one solid colour, claiming a 100% share
  it('refuses to draw a ring when everything is zero', () => {
    expect(toConicStops([{ color: '#a', value: 0 }, { color: '#b', value: 0 }])).toBeNull()
  })

  it('refuses to draw a ring with no slices at all', () => {
    expect(toConicStops([])).toBeNull()
  })
})

describe('toBarHeight', () => {
  // percentage-of-total would render four equal quadrants as four quarter-height bars
  it('scales against the tallest bar, not the total', () => {
    expect(toBarHeight(5, [5, 5, 5, 5])).toBe(100)
  })

  it('halves a bar that is half the tallest', () => {
    expect(toBarHeight(2, [4, 2])).toBe(50)
  })

  it('keeps an all-zero set flat rather than NaN', () => {
    expect(toBarHeight(0, [0, 0])).toBe(0)
  })
})

describe('heatIntensity', () => {
  it('gives zero its own step', () => {
    expect(heatIntensity(0, 10)).toBe(0)
  })

  it('puts a single task in the lowest visible bucket', () => {
    expect(heatIntensity(1, 40)).toBe(1)
  })

  it('puts the busiest day in the top bucket', () => {
    expect(heatIntensity(10, 10)).toBe(4)
  })

  // an empty year: every day zero and maxCount zero
  it('returns zero when the year has no activity at all', () => {
    expect(heatIntensity(0, 0)).toBe(0)
    expect(heatIntensity(3, 0)).toBe(0)
  })

  it('never exceeds the four defined steps', () => {
    expect(heatIntensity(99, 1)).toBe(4)
  })
})

describe('leadingBlanks', () => {
  // 2026-01-01 is a Thursday: Monday-indexed that is 3 blanks before it
  it('offsets the first column to the right weekday', () => {
    expect(leadingBlanks('2026-01-01')).toBe(3)
  })

  it('adds no blanks when the year starts on a Monday', () => {
    expect(leadingBlanks('2024-01-01')).toBe(0)
  })

  it('adds six blanks when the year starts on a Sunday', () => {
    expect(leadingBlanks('2023-01-01')).toBe(6)
  })
})

describe('percentChange and formatDelta', () => {
  it('computes an ordinary change', () => {
    expect(percentChange(15, 10)).toBe(50)
  })

  // the backend refuses to state a rate with a zero denominator; so does the UI
  it('is undefined rather than zero when the previous period was empty', () => {
    expect(percentChange(5, 0)).toBeNull()
  })

  it('renders a null delta as an em dash, never as 0%', () => {
    expect(formatDelta(null, '%')).toBe('—')
    expect(formatDelta(null)).toBe('—')
  })

  it('signs a positive delta and leaves a negative one alone', () => {
    expect(formatDelta(12.34, '%')).toBe('+12.3%')
    expect(formatDelta(-8, '%')).toBe('-8%')
    expect(formatDelta(0)).toBe('0')
  })
})

import { describe, expect, it } from 'vitest'
import { QUADRANTS, type Importance, type Urgency } from '../../types/task'
import { QUADRANT_CELLS, axesOf, quadrantOf } from './quadrant'

describe('quadrantOf', () => {
  // these four must match Quadrant.java exactly; a silent mismatch mislabels every task
  it.each([
    ['IMPORTANT', 'URGENT', 'DO_FIRST'],
    ['IMPORTANT', 'NOT_URGENT', 'SCHEDULE'],
    ['NOT_IMPORTANT', 'URGENT', 'DELEGATE'],
    ['NOT_IMPORTANT', 'NOT_URGENT', 'DROP'],
  ])('maps %s + %s to %s', (importance, urgency, expected) => {
    expect(quadrantOf(importance as Importance, urgency as Urgency)).toBe(expected)
  })
})

describe('axesOf', () => {
  it.each(QUADRANTS)('recovers both axes for %s', (quadrant) => {
    const axes = axesOf(quadrant)
    expect(quadrantOf(axes.importance, axes.urgency)).toBe(quadrant)
  })
})

describe('the mapping table', () => {
  it('covers all four quadrants exactly once', () => {
    expect(QUADRANT_CELLS).toHaveLength(4)
    expect(new Set(QUADRANT_CELLS.map((cell) => cell.quadrant)).size).toBe(4)
  })

  it('covers every axis combination, so no pair is unrepresentable', () => {
    const pairs = QUADRANT_CELLS.map((cell) => `${cell.importance}/${cell.urgency}`)
    expect(new Set(pairs).size).toBe(4)
  })

  it('rejects an unknown combination rather than guessing', () => {
    expect(() => quadrantOf('NONSENSE' as Importance, 'URGENT')).toThrow()
  })
})

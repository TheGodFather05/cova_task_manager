import type { Importance, Quadrant, Urgency } from '../../types/task'

export interface Axes {
  importance: Importance
  urgency: Urgency
}

export interface QuadrantCell extends Axes {
  quadrant: Quadrant
}

/**
 * One table, both directions. A cell IS an {importance, urgency} pair, so a contradictory
 * combination is not representable from the UI — mirroring the backend, where two separate
 * enum columns make it impossible to store. The error is unreachable, not merely validated.
 *
 * Layout from the kit: urgency across columns, importance down rows.
 *
 *              URGENT      NOT_URGENT
 *   IMPORTANT  Do first    Schedule
 *   NOT_IMP.   Delegate    Drop
 */
export const QUADRANT_CELLS: QuadrantCell[] = [
  { quadrant: 'DO_FIRST', importance: 'IMPORTANT', urgency: 'URGENT' },
  { quadrant: 'SCHEDULE', importance: 'IMPORTANT', urgency: 'NOT_URGENT' },
  { quadrant: 'DELEGATE', importance: 'NOT_IMPORTANT', urgency: 'URGENT' },
  { quadrant: 'DROP', importance: 'NOT_IMPORTANT', urgency: 'NOT_URGENT' },
]

export function quadrantOf(importance: Importance, urgency: Urgency): Quadrant {
  const match = QUADRANT_CELLS.find(
    (cell) => cell.importance === importance && cell.urgency === urgency,
  )
  if (!match) {
    throw new Error(`no quadrant for ${importance} and ${urgency}`)
  }
  return match.quadrant
}

export function axesOf(quadrant: Quadrant): Axes {
  const match = QUADRANT_CELLS.find((cell) => cell.quadrant === quadrant)
  if (!match) {
    throw new Error(`unknown quadrant ${quadrant}`)
  }
  return { importance: match.importance, urgency: match.urgency }
}

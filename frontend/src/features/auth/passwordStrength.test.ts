import { describe, expect, it } from 'vitest'
import { assessPassword } from './passwordStrength'

describe('assessPassword', () => {
  it('says nothing for an empty field', () => {
    expect(assessPassword('')).toEqual({ score: 0, label: '', hint: '' })
  })

  it('flags a password the API would reject as too short', () => {
    expect(assessPassword('abc123').label).toBe('Too short')
  })

  it('rates a minimal but acceptable password without blocking it', () => {
    // the API accepts any 8+ character password; the meter only advises
    const result = assessPassword('password')
    expect(result.score).toBeGreaterThan(0)
    expect(result.label).not.toBe('Too short')
  })

  it('rewards length, mixed case, digits and symbols', () => {
    expect(assessPassword('password').score).toBeLessThan(
      assessPassword('Password1234!').score,
    )
  })

  it('never exceeds the four meter segments', () => {
    expect(assessPassword('AVeryLong1!PassphraseWith#Symbols').score).toBe(4)
  })
})

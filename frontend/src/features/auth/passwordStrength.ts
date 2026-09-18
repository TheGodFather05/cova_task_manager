export interface PasswordStrength {
  /** 0-4, drives how many meter segments are filled */
  score: number
  label: string
  hint: string
}

/**
 * Advisory only. The API accepts any password of 8-72 characters, so the meter must never
 * block a submission the backend would have allowed.
 */
export function assessPassword(password: string): PasswordStrength {
  if (!password) {
    return { score: 0, label: '', hint: '' }
  }

  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^\w\s]/.test(password)) score++

  const capped = Math.min(score, 4)

  if (password.length < 8) {
    return { score: Math.min(capped, 1), label: 'Too short', hint: 'Use at least 8 characters.' }
  }
  if (capped <= 1) return { score: 1, label: 'Weak', hint: 'Mix in letters and digits.' }
  if (capped === 2) return { score: 2, label: 'Fair', hint: 'Add upper case or a digit.' }
  if (capped === 3) {
    return { score: 3, label: 'Strong', hint: 'Add a symbol to max it out.' }
  }
  return { score: 4, label: 'Excellent', hint: 'This one holds up well.' }
}

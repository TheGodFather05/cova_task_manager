import { createContext } from 'react'

export type ToastTone = 'success' | 'error'

export interface Toast {
  id: number
  tone: ToastTone
  title: string
  detail?: string
}

/** tone defaults to success: confirmations outnumber failures. */
export type ToastInput = Omit<Toast, 'id' | 'tone'> & { tone?: ToastTone }

export interface ToastContextValue {
  notify: (toast: ToastInput) => void
  dismiss: (id: number) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)

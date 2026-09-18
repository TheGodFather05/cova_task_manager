import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  ToastContext,
  type Toast,
  type ToastContextValue,
  type ToastInput,
} from './ToastContext'
import { ToastViewport } from './ToastViewport'

const DISMISS_AFTER_MS = 5000

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>())

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const notify = useCallback(
    (toast: ToastInput) => {
      const id = nextId.current++
      setToasts((current) => [...current, { tone: 'success', ...toast, id }])
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), DISMISS_AFTER_MS),
      )
    },
    [dismiss],
  )

  const value = useMemo<ToastContextValue>(() => ({ notify, dismiss }), [notify, dismiss])

  return (
    <ToastContext value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext>
  )
}

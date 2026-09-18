import type { Toast } from './ToastContext'

interface ToastViewportProps {
  toasts: Toast[]
  onDismiss: (id: number) => void
}

export function ToastViewport({ toasts, onDismiss }: ToastViewportProps) {
  if (toasts.length === 0) {
    return null
  }

  return (
    <div
      // polite: a saved-task confirmation should not interrupt a screen reader mid-sentence
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 top-4 z-50 flex flex-col items-end gap-2.5 sm:inset-x-auto sm:right-6 sm:top-6"
    >
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          onClick={() => onDismiss(toast.id)}
          className={`pointer-events-auto flex w-full max-w-[360px] items-start gap-3 rounded-control
                      px-4 py-3.5 text-left shadow-lg transition-opacity hover:opacity-90 ${
                        toast.tone === 'success'
                          ? 'bg-primary-deep shadow-[0_10px_28px_rgb(14_95_97/0.22)]'
                          : 'bg-[#b91c1c] shadow-[0_10px_28px_rgb(185_28_28/0.2)]'
                      }`}
        >
          <span
            className={`mt-1.5 size-2 shrink-0 rounded-pill ${
              toast.tone === 'success' ? 'bg-[#7fd4d5]' : 'bg-[#fca5a5]'
            }`}
          />
          <span className="flex flex-col gap-0.5">
            <span className="text-secondary font-semibold text-white">{toast.title}</span>
            {toast.detail ? (
              <span className="text-xs text-white/80">{toast.detail}</span>
            ) : null}
          </span>
        </button>
      ))}
    </div>
  )
}

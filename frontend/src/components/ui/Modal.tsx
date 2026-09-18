import { useEffect, useRef, type ReactNode } from 'react'

interface ModalProps {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
}

export function Modal({ open, title, description, onClose, children }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    // move focus into the dialog so keyboard and screen-reader users land inside it
    dialogRef.current?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-ink/40 backdrop-blur-[2px]"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="relative z-10 flex max-h-[92dvh] w-full max-w-[480px] flex-col gap-5
                   overflow-y-auto rounded-t-card border border-line bg-raised p-6
                   shadow-[0_12px_40px_rgb(14_95_97/0.18)] outline-none sm:rounded-card sm:p-8"
      >
        <div className="flex flex-col gap-1.5">
          <h2 className="text-heading font-semibold text-ink">{title}</h2>
          {description ? <p className="text-secondary text-muted">{description}</p> : null}
        </div>
        {children}
      </div>
    </div>
  )
}

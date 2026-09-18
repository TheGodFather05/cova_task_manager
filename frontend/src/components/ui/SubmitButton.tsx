import type { ReactNode } from 'react'

interface SubmitButtonProps {
  pending: boolean
  pendingLabel: string
  children: ReactNode
}

export function SubmitButton({ pending, pendingLabel, children }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-control bg-primary px-4 py-3.5 text-body font-semibold text-on-primary
                 transition-colors hover:bg-primary-deep focus-visible:outline-2
                 focus-visible:outline-offset-2 focus-visible:outline-primary
                 disabled:cursor-not-allowed disabled:bg-primary/40"
    >
      {pending ? pendingLabel : children}
    </button>
  )
}

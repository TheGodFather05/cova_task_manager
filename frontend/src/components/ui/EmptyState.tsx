import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-card border border-line bg-surface px-6 py-14 text-center">
      <div className="flex h-[140px] w-[220px] items-center justify-center rounded-card border border-dashed border-primary/40 bg-primary-tint">
        <EmptyIllustration />
      </div>
      <div className="flex flex-col gap-1.5">
        <p className="text-heading font-semibold text-ink">{title}</p>
        <p className="max-w-[420px] text-secondary text-muted">{description}</p>
      </div>
      {action}
    </div>
  )
}

function EmptyIllustration() {
  return (
    <svg viewBox="0 0 120 72" className="h-[72px] w-[120px]" aria-hidden>
      <rect x="10" y="12" width="100" height="14" rx="4" className="fill-primary/25" />
      <rect x="10" y="32" width="72" height="14" rx="4" className="fill-primary/18" />
      <rect x="10" y="52" width="86" height="14" rx="4" className="fill-primary/10" />
      <circle cx="98" cy="39" r="12" className="fill-primary/20" />
      <path
        d="M93 39.5l3.5 3.5 7-7.5"
        fill="none"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-primary"
      />
    </svg>
  )
}

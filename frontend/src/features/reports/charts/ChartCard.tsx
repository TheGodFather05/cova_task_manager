import type { ReactNode } from 'react'

interface ChartCardProps {
  title: string
  caption?: string
  children: ReactNode
}

export function ChartCard({ title, caption, children }: ChartCardProps) {
  return (
    <section className="flex flex-col gap-4 rounded-card border border-line bg-surface p-5 sm:p-6">
      <header className="flex flex-col gap-1">
        <h2 className="text-body font-semibold text-ink">{title}</h2>
        {caption ? <p className="text-xs text-muted">{caption}</p> : null}
      </header>
      {children}
    </section>
  )
}

export function ChartEmpty({ message }: { message: string }) {
  return (
    <p className="flex min-h-[140px] items-center justify-center text-center text-xs text-faint">
      {message}
    </p>
  )
}

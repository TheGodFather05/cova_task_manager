import type { ReactNode } from 'react'
import { ThemeToggle } from '../../components/ThemeToggle'

interface AuthCardProps {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}

export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-ground">
      <div className="flex justify-end p-5">
        <ThemeToggle />
      </div>
      <main className="flex flex-1 items-start justify-center px-5 pb-16 sm:items-center sm:pb-24">
        <div
          className="flex w-full max-w-[420px] flex-col gap-5 rounded-card border border-line
                     bg-raised p-8 shadow-[0_8px_28px_rgb(14_95_97/0.07)] sm:p-10"
        >
          <div className="flex flex-col gap-4">
            <div className="flex size-12 items-center justify-center rounded-card bg-primary text-body font-bold text-on-primary">
              TL
            </div>
            <div className="flex flex-col gap-1.5">
              <h1 className="text-heading font-semibold text-ink">{title}</h1>
              <p className="text-secondary text-muted">{subtitle}</p>
            </div>
          </div>
          {children}
          <p className="text-secondary text-muted">{footer}</p>
        </div>
      </main>
    </div>
  )
}

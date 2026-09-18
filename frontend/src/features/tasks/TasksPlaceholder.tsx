import { useAuth } from '../../auth/useAuth'
import { ThemeToggle } from '../../components/ThemeToggle'

/** Replaced by the real list in F7; exists so the protected route has something to guard. */
export function TasksPlaceholder() {
  const { email, logout } = useAuth()

  return (
    <div className="min-h-dvh bg-ground">
      <header className="flex items-center justify-between border-b border-line bg-surface px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-control bg-primary text-xs font-bold text-on-primary">
            TL
          </div>
          <span className="text-body font-semibold text-primary-deep">Taskline</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-secondary text-muted">{email}</span>
          <ThemeToggle />
          <button
            type="button"
            onClick={logout}
            className="text-secondary font-medium text-muted transition-colors hover:text-primary"
          >
            Log out
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-[1120px] px-6 py-16">
        <h1 className="text-display font-semibold text-ink">Tasks</h1>
        <p className="mt-2 text-body text-muted">
          You are signed in. The task list arrives in the next step.
        </p>
      </main>
    </div>
  )
}

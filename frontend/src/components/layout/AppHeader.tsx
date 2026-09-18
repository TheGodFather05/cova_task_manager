import { NavLink } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { ThemeToggle } from '../ThemeToggle'

const NAV_ITEMS = [
  { to: '/tasks', label: 'Tasks' },
  { to: '/reports', label: 'Reports' },
]

/**
 * One header, two layouts. The kit keeps the teal bar on mobile rather than switching to a
 * bottom tab bar, so the same nav items reflow instead of being rendered twice.
 */
export function AppHeader() {
  const { email, logout } = useAuth()

  return (
    <header className="bg-primary text-on-primary">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-4 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-8 sm:py-4">
        <div className="flex items-center justify-between gap-3 sm:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-control bg-on-primary/15 text-xs font-bold">
              TL
            </div>
            <span className="text-[17px] font-semibold">Taskline</span>
          </div>
          <div className="sm:hidden">
            <ThemeToggle onPrimary />
          </div>
        </div>

        <nav className="flex items-center gap-1.5" aria-label="Main">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-lg px-4 py-2 text-[13px] font-semibold transition-colors ${
                  isActive
                    ? 'bg-surface text-primary-deep'
                    : 'text-on-primary/80 hover:bg-on-primary/10 hover:text-on-primary'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3 sm:gap-4">
          <span className="hidden text-[13px] text-on-primary/80 md:inline">{email}</span>
          <div className="hidden sm:block">
            <ThemeToggle onPrimary />
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg px-2 py-1 text-[13px] font-medium text-on-primary/90 transition-colors hover:bg-on-primary/10 hover:text-on-primary"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  )
}

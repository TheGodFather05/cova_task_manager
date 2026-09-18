import { Outlet } from 'react-router-dom'
import { AppHeader } from './AppHeader'

export function AppLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-ground">
      <AppHeader />
      <main className="mx-auto w-full max-w-[1120px] flex-1 px-5 py-8 sm:px-8">
        <Outlet />
      </main>
    </div>
  )
}

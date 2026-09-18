import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    // replace: without it the protected URL stays in history and Back bounces
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}

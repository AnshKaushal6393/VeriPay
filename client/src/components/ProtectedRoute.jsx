import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function ProtectedRoute({ redirectTo = '/login' }) {
  const { isAuthenticated, isAuthReady } = useAuth()
  const location = useLocation()

  if (!isAuthReady) {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />
  }

  return <Outlet />
}

export default ProtectedRoute

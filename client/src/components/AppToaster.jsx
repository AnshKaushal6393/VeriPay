import { Toaster } from 'react-hot-toast'
import { useLocation } from 'react-router-dom'

function AppToaster() {
  const location = useLocation()
  const isAuthPage =
    location.pathname === '/login' || location.pathname === '/register'

  return (
    <Toaster
      position={isAuthPage ? 'top-center' : 'top-right'}
      gutter={14}
      containerStyle={{
        zIndex: 80,
        top: 20,
        right: isAuthPage ? undefined : 20,
        left: isAuthPage ? 20 : undefined,
      }}
      toastOptions={{
        duration: 3600,
      }}
    />
  )
}

export default AppToaster

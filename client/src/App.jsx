import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import InvoicesPage from './pages/InvoicesPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import VendorsPage from './pages/VendorsPage'
import VendorDetailPage from './pages/VendorDetailPage'

function App() {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? '/vendors' : '/login'} replace />}
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/invoices" element={<InvoicesPage />} />
        <Route path="/vendors" element={<VendorsPage />} />
        <Route path="/vendors/:id" element={<VendorDetailPage />} />
      </Route>
    </Routes>
  )
}

export default App

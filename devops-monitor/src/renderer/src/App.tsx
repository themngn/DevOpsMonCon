import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useServer } from './contexts/ServerProvider'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ServicesPage from './pages/ServicesPage'
import AlertsPage from './pages/AlertsPage'
import LogsPage from './pages/LogsPage'
import SettingsPage from './pages/SettingsPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { activeServer, loading } = useServer()

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (!activeServer) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function App(): React.JSX.Element {
  const { activeServer, loading } = useServer()

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  // Redirect to login if no active server
  if (!activeServer) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/services"
          element={
            <ProtectedRoute>
              <ServicesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/alerts"
          element={
            <ProtectedRoute>
              <AlertsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/logs"
          element={
            <ProtectedRoute>
              <LogsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

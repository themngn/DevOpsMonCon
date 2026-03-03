import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useServer } from './contexts/ServerProvider'
import AppShell from './components/layout/AppShell'
import ServerSelectPage from './pages/ServerSelectPage'
import DashboardPage from './pages/DashboardPage'
import ServicesPage from './pages/ServicesPage'
import ServiceDetailPage from './pages/ServiceDetailPage'
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
          <Route path="/login" element={<ServerSelectPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<ServerSelectPage />} />

        {/* Protected Routes wrapped in AppShell */}
        <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/services/:id" element={<ServiceDetailPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/logs" element={<LogsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

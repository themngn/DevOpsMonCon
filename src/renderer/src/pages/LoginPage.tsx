import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useServer } from '../contexts/ServerProvider'

export default function LoginPage() {
  const navigate = useNavigate()
  const { addServer, setActiveServer } = useServer()
  const [serverName, setServerName] = useState('')
  const [serverUrl, setServerUrl] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAddServer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!serverName || !serverUrl) return

    try {
      setLoading(true)
      const server = {
        id: Math.random().toString(36).slice(2),
        name: serverName,
        url: serverUrl
      }
      await addServer(server)
      await setActiveServer(server)
      navigate('/')
    } catch (error) {
      console.error('Failed to add server:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">DevOps Monitor</h2>
          <p className="text-sm text-muted-foreground">Add a server to get started</p>
        </div>
        <form onSubmit={handleAddServer} className="space-y-4">
          <div>
            <label htmlFor="name" className="text-sm font-medium">
              Server Name
            </label>
            <input
              id="name"
              placeholder="e.g., Production"
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label htmlFor="url" className="text-sm font-medium">
              Server URL
            </label>
            <input
              id="url"
              placeholder="e.g., http://localhost:3000"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Connecting...' : 'Connect'}
          </button>
        </form>
      </div>
    </div>
  )
}

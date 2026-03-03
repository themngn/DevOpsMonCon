import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useServer } from '../contexts/ServerProvider'
import { storage } from '../utils/storage'
import { ServerEntry } from '../types'
import { Plus, Server as ServerIcon, Wifi, Loader2 } from 'lucide-react'

export default function ServerSelectPage() {
  const navigate = useNavigate()
  const { connect } = useServer()
  const [servers, setServers] = useState<ServerEntry[]>(() =>
    storage.get<ServerEntry[]>('savedServers', [])
  )
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [isTesting, setIsTesting] = useState(false)

  const handleConnect = (server: ServerEntry) => {
    connect(server)
    navigate('/')
  }

  const handleAddServer = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !url.trim()) {
      setError('All fields are required')
      return
    }
    if (!url.startsWith('http')) {
      setError('URL must start with http:// or https://')
      return
    }

    const newServer: ServerEntry = {
      id: crypto.randomUUID(),
      name,
      url,
      lastConnected: Date.now()
    }

    const updatedServers = [...servers, newServer]
    setServers(updatedServers)
    storage.set('savedServers', updatedServers)
    setName('')
    setUrl('')
    setError('')
  }

  const handleTestConnection = async () => {
    if (!url) return
    setIsTesting(true)
    setError('')
    try {
      // Намагаємося зробити запит до сервера. 
      // Якщо це ваш Express сервер, він має відповідати на GET /
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Status: ${res.status}`)
      alert('Connection successful! Server is ready.')
    } catch (err) {
      console.error('Connection failed:', err)
      setError('Failed to connect. Check URL and ensure server is running.')
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Select Server</h1>
          <p className="text-muted-foreground">Connect to a DevOps Monitor instance</p>
        </div>

        <div className="space-y-4">
          {servers.length === 0 ? (
            <div className="p-8 text-center border rounded-lg border-dashed text-muted-foreground">
              No servers saved yet
            </div>
          ) : (
            <div className="space-y-2">
              {servers.map((server) => (
                <div key={server.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <ServerIcon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{server.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{server.url}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleConnect(server)}
                    className="px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                  >
                    Connect
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleAddServer} className="space-y-4 pt-4 border-t">
          <h2 className="text-sm font-semibold">Add New Server</h2>
          <div className="space-y-2">
            <input
              placeholder="Server Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background"
            />
            <div className="flex gap-2">
              <input
                placeholder="Server URL (http://localhost:3001)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-md bg-background"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting || !url}
                className="px-3 py-2 border rounded-md hover:bg-muted disabled:opacity-50"
                title="Test Connection"
              >
                {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
          >
            <Plus className="w-4 h-4" /> Add Server
          </button>
        </form>
      </div>
    </div>
  )
}
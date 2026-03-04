import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useServer } from '../contexts/ServerProvider'
import { storage } from '../utils/storage'
import { ServerEntry } from '../types'
import { Plus, Server as ServerIcon, Loader2 } from 'lucide-react'

export default function ServerSelectPage() {
  const navigate = useNavigate()
  const { connect } = useServer()
  const [servers, setServers] = useState<ServerEntry[]>(() =>
    storage.get<ServerEntry[]>('savedServers', [])
  )
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [connectingId, setConnectingId] = useState<string | null>(null)

  const handleConnect = async (server: ServerEntry) => {
    setConnectingId(server.id)
    setError('')

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)

    try {
      const baseUrl = server.url.replace(/\/$/, '')
      // Спроба отримати статус сервера для перевірки доступності
      const response = await fetch(`${baseUrl}/api/status`, {
        signal: controller.signal,
        cache: 'no-store'
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`)
      }

      // Якщо успішно, підключаємось
      connect(server)
      navigate('/')
    } catch (err: any) {
      clearTimeout(timeoutId)
      console.error('Connection failed:', err)

      if (err.name === 'AbortError') {
        setError(`Connection to "${server.name}" timed out after 3 seconds.`)
      } else {
        setError(`Could not connect to "${server.name}": ${err.message}. Make sure the URL is correct and the server is running.`)
      }
    } finally {
      setConnectingId(null)
    }
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
                <div
                  key={server.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-card"
                >
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
                    disabled={connectingId !== null}
                    className="px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2 min-w-[90px] justify-center"
                  >
                    {connectingId === server.id ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span className="text-xs">Connecting</span>
                      </>
                    ) : (
                      'Connect'
                    )}
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

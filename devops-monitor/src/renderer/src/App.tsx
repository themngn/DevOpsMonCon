/*import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'

function App(): React.JSX.Element {
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  return (
    <>
      <img alt="logo" className="logo" src={electronLogo} />
      <div className="creator">Powered by electron-vite</div>
      <div className="text">
        Build an Electron app with <span className="react">React</span>
        &nbsp;and <span className="ts">TypeScript</span>
      </div>
      <p className="tip">
        Please try pressing <code>F12</code> to open the devTool
      </p>
      <div className="actions">
        <div className="action">
          <a href="https://electron-vite.org/" target="_blank" rel="noreferrer">
            Documentation
          </a>
        </div>
        <div className="action">
          <a target="_blank" rel="noreferrer" onClick={ipcHandle}>
            Send IPC
          </a>
        </div>
      </div>
      <Versions></Versions>
    </>
  )
}

export default App*/
import { JSX, useEffect, useState } from 'react'

function App(): JSX.Element {
  const [status, setStatus] = useState<any>(null)

  useEffect(() => {
    // Тест API
    const port = window.api.getApiPort()
    fetch(`http://127.0.0.1:${port}/api/status`)
      .then(res => res.json())
      .then(data => setStatus(data))
      .catch(err => console.error("API Error:", err))
  }, [])

  return (
    <div className="p-4 bg-background text-foreground min-h-screen">
      <h1 className="text-2xl font-bold mb-4">DevOps Monitor Initialization</h1>
      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <h2 className="font-semibold">API Status Check</h2>
          <pre className="mt-2 bg-muted p-2 rounded text-sm">
            {status ? JSON.stringify(status, null, 2) : "Loading..."}
          </pre>
        </div>
      </div>
    </div>
  )
}

export default App

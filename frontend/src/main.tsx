import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { createServices } from './app/createServices'
import './styles/tokens.css'
import './styles/base.css'
import './styles/print.css'

async function start() {
  if (import.meta.env.VITE_API_MOCK === 'true') {
    const { startMockWorker } = await import('./app/mockWorker')
    await startMockWorker()
  }
  const services = createServices({ apiBase: import.meta.env.VITE_API_BASE, dev: import.meta.env.DEV })
  const root = document.getElementById('root')
  if (root) createRoot(root).render(<App services={services} />)
}

void start()

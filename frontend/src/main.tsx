import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { createServices, type ServiceOverrides } from './app/createServices'
import './styles/tokens.css'
import './styles/base.css'
import './styles/print.css'

async function start() {
  const overrides: ServiceOverrides = {}
  if (import.meta.env.VITE_API_MOCK === 'true') {
    const { startMockWorker } = await import('./app/mockWorker')
    Object.assign(overrides, { clock: await startMockWorker() })
  }
  const services = createServices({ apiBase: import.meta.env.VITE_API_BASE, dev: import.meta.env.DEV }, overrides)
  const root = document.getElementById('root')
  if (root) createRoot(root).render(<App services={services} />)
}

void start()

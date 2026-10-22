import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import './styles/base.css'

const root = document.getElementById('root')
if (root) {
  createRoot(root).render(
    <StrictMode>
      <main style={{ padding: 32 }}>
        <h1>Folio</h1>
      </main>
    </StrictMode>,
  )
}

import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { server } from './server'

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' })
})
afterEach(() => {
  cleanup()
  server.resetHandlers()
  window.localStorage.clear()
  window.sessionStorage.clear()
})
afterAll(() => {
  server.close()
})

import { setupServer } from 'msw/node'

/** One MSW server for all tests; each test installs handlers backed by a fresh db. */
export const server = setupServer()
export const API_BASE = import.meta.env.VITE_API_BASE

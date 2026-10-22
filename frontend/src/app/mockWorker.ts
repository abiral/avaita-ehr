import { startBrowserMock } from '@/infrastructure/mock/browser'

export const startMockWorker = () => startBrowserMock(import.meta.env.VITE_API_BASE)

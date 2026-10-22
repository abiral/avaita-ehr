import { existsSync } from 'node:fs'
import { defineConfig, devices } from '@playwright/test'

const localChromium = '/opt/pw-browsers/chromium'
const launchOptions = existsSync(localChromium) && !process.env['CI'] ? { executablePath: localChromium } : {}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env['CI']),
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? 'github' : 'list',
  use: { baseURL: 'http://localhost:4173', trace: 'on-first-retry', timezoneId: 'America/New_York' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], launchOptions } }],
  webServer: { command: 'npm run preview:mock', url: 'http://localhost:4173', reuseExistingServer: !process.env['CI'] },
})

process.loadEnvFile?.('.env')

import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  reporter: 'html',

  use: {
    baseURL: process.env.GEODOCK_URL,
    storageState: 'auth-state.json',
    viewport: { width: 1920, height: 1080 },
    video: 'on',
    screenshot: 'on',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})

import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  use: {
    baseURL: 'http://localhost:3005',
    headless: true,
  },
  timeout: 60000,
})


// Einmaliges Setup-Skript: öffnet die Login-Seite, wartet auf die manuelle
// Anmeldung durch dich und speichert den angemeldeten Zustand danach in
// auth-state.json. Ausführen mit: pnpm test:e2e:setup
process.loadEnvFile?.('.env')

import { chromium } from '@playwright/test'
import { createInterface } from 'node:readline/promises'

const baseURL = process.env.GEODOCK_URL
if (!baseURL) {
  throw new Error('GEODOCK_URL ist nicht gesetzt (siehe .env)')
}

const authFile = 'auth-state.json'

const browser = await chromium.launch({ headless: false })
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
const page = await context.newPage()

await page.goto(baseURL)

const rl = createInterface({ input: process.stdin, output: process.stdout })
await rl.question(
  '\nBitte im geöffneten Browser-Fenster einloggen.\n' +
    'Danach hier im Terminal Enter drücken, um den Login-Zustand zu speichern...\n',
)
rl.close()

await context.storageState({ path: authFile })
await browser.close()

console.log(`Login-Zustand gespeichert in ${authFile}`)

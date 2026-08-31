import { test } from '@playwright/test'

// Screenshots für Kapitel "3. Einstieg und Anmeldung" im Handbuch
// (manual/teil-a-anwenderhandbuch/03-einstieg-und-anmeldung.md).
// Nutzt den in auth-state.json gespeicherten Login-Zustand (siehe playwright.config.ts).
test('Login-Seite', async ({ page }) => {
  await page.goto('/')
  await page.screenshot({ path: 'tests/screenshots/03-einstieg-anmeldung/login_start.png' })
})

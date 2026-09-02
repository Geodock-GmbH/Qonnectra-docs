// Zugangsdaten und URLs der lokalen Qonnectra-Instanz.
//
// Alle Playwright-Läufe in diesem Repo richten sich ausschließlich auf die
// lokale Instanz aus local-app/. Die Werte kommen aus der beim Setup erzeugten
// local-app/deployment/.env, nicht aus einer eigenen Konfigurationsdatei –
// damit kann kein Lauf versehentlich gegen eine echte Installation gehen.
//
// Instanz aufsetzen/starten: scripts/setup-local-qonnectra.sh
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const deploymentEnvPath = fileURLToPath(new URL('../local-app/deployment/.env', import.meta.url))

const setupHinweis =
  'Bitte zuerst die lokale Instanz aufsetzen und starten:\n' +
  '  scripts/setup-local-qonnectra.sh'

function readDeploymentEnv(): Record<string, string> {
  let content: string
  try {
    content = readFileSync(deploymentEnvPath, 'utf8')
  } catch {
    throw new Error(
      `Die lokale Qonnectra-Instanz ist nicht eingerichtet – ${deploymentEnvPath} fehlt.\n${setupHinweis}`,
    )
  }

  const env: Record<string, string> = {}
  for (const line of content.split('\n')) {
    const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line)
    if (!match) continue
    env[match[1]] = match[2].trim().replace(/^(['"])(.*)\1$/, '$2')
  }
  return env
}

function required(env: Record<string, string>, key: string): string {
  const value = env[key]
  if (!value) {
    throw new Error(
      `${key} fehlt oder ist leer in ${deploymentEnvPath}.\n` +
        'Die Instanz wurde vermutlich unvollständig eingerichtet. Neu aufbauen mit:\n' +
        '  scripts/setup-local-qonnectra.sh --reset',
    )
  }
  return value
}

export interface LocalApp {
  /** Frontend, z. B. https://app.qonnectra.localhost */
  appUrl: string
  /** Backend-API, z. B. https://api.qonnectra.localhost */
  apiUrl: string
  /** Django-Superuser der lokalen Instanz – niemals ausgeben oder committen. */
  username: string
  password: string
}

let cached: LocalApp | undefined

export function localApp(): LocalApp {
  if (cached) return cached

  const env = readDeploymentEnv()
  cached = {
    appUrl: `https://${required(env, 'APP_DOMAIN')}`,
    apiUrl: `https://${required(env, 'API_DOMAIN')}`,
    username: required(env, 'DJANGO_SUPERUSER_USERNAME'),
    password: required(env, 'DJANGO_SUPERUSER_PASSWORD'),
  }
  return cached
}

/**
 * Von scripts/setup-local-qonnectra.sh vergebene Frontend-Adresse. Dient als
 * Rückfallwert, solange die Instanz noch nicht eingerichtet ist, damit
 * `playwright test --list` auch dann funktioniert.
 */
export const DEFAULT_APP_URL = 'https://app.qonnectra.localhost'

/**
 * Nur die URL – für playwright.config.ts, ohne die Zugangsdaten zu berühren
 * und ohne zu scheitern, wenn die Instanz fehlt. Den harten Check macht das
 * Setup-Projekt (playwright/auth.setup.ts).
 */
export function localAppUrl(): string {
  try {
    return localApp().appUrl
  } catch {
    return DEFAULT_APP_URL
  }
}

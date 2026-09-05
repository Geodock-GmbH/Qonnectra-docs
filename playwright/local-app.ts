// Credentials and URLs of the local Qonnectra instance.
//
// All Playwright runs in this repo target the local instance in local-app/ and
// nothing else. The values come from local-app/deployment/.env, generated
// during setup, and not from a configuration file of our own - that way no run
// can accidentally go against a real installation.
//
// The instance knows two accounts: the Django superuser for administration and
// an account without administration rights, which the images are made with.
// The latter is the default, see Role/role() below.
//
// Set up / start the instance: scripts/setup-local-qonnectra.sh
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const deploymentEnvPath = fileURLToPath(new URL('../local-app/deployment/.env', import.meta.url))

const setupHint =
  'Please set up and start the local instance first:\n' +
  '  scripts/setup-local-qonnectra.sh'

function readDeploymentEnv(): Record<string, string> {
  let content: string
  try {
    content = readFileSync(deploymentEnvPath, 'utf8')
  } catch {
    throw new Error(
      `The local Qonnectra instance is not set up - ${deploymentEnvPath} is missing.\n${setupHint}`,
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
      `${key} is missing or empty in ${deploymentEnvPath}.\n` +
        'The instance was probably set up incompletely. Rebuild it with:\n' +
        '  scripts/setup-local-qonnectra.sh --reset',
    )
  }
  return value
}

/**
 * Like required(), but for keys that did not exist in earlier versions of the
 * setup script. For those another run without --reset is enough: the script
 * appends missing keys to .env and creates the account.
 */
function requiredNew(env: Record<string, string>, key: string): string {
  const value = env[key]
  if (!value) {
    throw new Error(
      `${key} is missing or empty in ${deploymentEnvPath}.\n` +
        'The instance was set up with an older version of the setup script.\n' +
        'Run it once more (database and existing secrets are kept):\n' +
        '  scripts/setup-local-qonnectra.sh',
    )
  }
  return value
}

/**
 * Which account a run logs in with.
 *
 * - `user`: account without administration rights (group "Editor"). The
 *   default, because part A of the manual describes the view of ordinary
 *   users - the superuser additionally sees the "Logs" menu entry and bypasses
 *   every permission check.
 * - `admin`: Django superuser. Only for images of areas that stay hidden from
 *   users without administration rights (`/admin/*`).
 */
export type Role = 'user' | 'admin'

/** Switchable via QONNECTRA_LOGIN=admin (see Role). */
export function role(): Role {
  const value = process.env.QONNECTRA_LOGIN?.trim().toLowerCase()
  if (!value || value === 'user') return 'user'
  if (value === 'admin') return 'admin'
  throw new Error(`QONNECTRA_LOGIN=${value} is unknown. Allowed are "user" (default) and "admin".`)
}

export interface LocalApp {
  /** Frontend, e.g. https://app.qonnectra.localhost */
  appUrl: string
  /** Backend API, e.g. https://api.qonnectra.localhost */
  apiUrl: string
  /** Account this run works with (see role()). */
  role: Role
  /** Credentials of the selected role - never print or commit them. */
  username: string
  password: string
}

let cached: LocalApp | undefined

export function localApp(): LocalApp {
  if (cached) return cached

  const env = readDeploymentEnv()
  const selected = role()
  cached = {
    appUrl: `https://${required(env, 'APP_DOMAIN')}`,
    apiUrl: `https://${required(env, 'API_DOMAIN')}`,
    role: selected,
    username:
      selected === 'admin'
        ? required(env, 'DJANGO_SUPERUSER_USERNAME')
        : requiredNew(env, 'APP_USER_USERNAME'),
    password:
      selected === 'admin'
        ? required(env, 'DJANGO_SUPERUSER_PASSWORD')
        : requiredNew(env, 'APP_USER_PASSWORD'),
  }
  return cached
}

/**
 * Credentials of the Django superuser - independent of the role the run works
 * with.
 *
 * Intended exclusively for **cleaning up** after captures, never for the
 * capture itself. Background: the group "Editor" the images are made with has
 * access level "edit" on all domain models and is therefore not allowed to
 * DELETE (`RoleBasedPermission` in the backend). A spec that creates something
 * for a capture - an attachment, say - cannot remove it again with the capture
 * account, and the next run would start in a different state.
 */
export function superuserCredentials(): { username: string; password: string } {
  const env = readDeploymentEnv()
  return {
    username: required(env, 'DJANGO_SUPERUSER_USERNAME'),
    password: required(env, 'DJANGO_SUPERUSER_PASSWORD'),
  }
}

/**
 * Frontend address assigned by scripts/setup-local-qonnectra.sh. Serves as a
 * fallback while the instance is not set up yet, so that
 * `playwright test --list` works even then.
 */
export const DEFAULT_APP_URL = 'https://app.qonnectra.localhost'

/**
 * The URL only - for playwright.config.ts, without touching the credentials and
 * without failing when the instance is missing. The hard check is done by the
 * setup project (playwright/auth.setup.ts).
 */
export function localAppUrl(): string {
  try {
    return localApp().appUrl
  } catch {
    return DEFAULT_APP_URL
  }
}

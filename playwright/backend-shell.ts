// Running a snippet inside the backend container.
//
// The REST API is the capture account's interface, and some things the specs
// need are not on it at all: user accounts and their dates, the orphan flag of
// an attachment, the timestamp a log entry was written with, the history rows
// django-simple-history keeps. They are maintained in the administration area,
// which is exactly what the chapters 19-28 describe - so a spec reaches past
// both interfaces and runs a few lines of Python through `manage.py shell` in
// the backend container, the same way tests/04-dashboard.spec.ts HUPs the
// gunicorn workers. The docker CLI is in the capture image for this, and
// scripts/capture.sh mounts the host's socket.
//
// Two rules for what goes through here:
//
// - Only state the run creates or pins, never edits to the demo data. A spec
//   that seeds something removes it again (afterAll), and a pinned value is
//   one the backend would have stamped with the day of the run anyway
//   (`auto_now_add` and friends ignore whatever `save()` is given - set them
//   through `QuerySet.update()`, which bypasses the field logic).
// - Placeholder values only (see CLAUDE.md, "Personal data in images"): the
//   rows end up in the database for the length of the run and in the images
//   for good.
import { execFileSync } from 'node:child_process'

/** Container name from local-app/deployment/docker-compose.yml. */
export const BACKEND_CONTAINER = 'qonnectra_backend_prod'

/**
 * Runs `script` with `manage.py shell -c` in the backend container and returns
 * what it printed. `what` names the step for the error message.
 *
 * A snippet that has to carry values in builds them with `pyLiteral()` rather
 * than string concatenation, so that a quote or a backslash in a value cannot
 * break the Python.
 */
export function runInBackend(script: string, what: string): string {
  try {
    return execFileSync(
      'docker',
      ['exec', '-i', BACKEND_CONTAINER, 'python', 'manage.py', 'shell', '-c', script],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    )
  } catch (error) {
    const stderr = (error as { stderr?: string }).stderr?.toString().trim()
    throw new Error(
      `${what} failed: docker exec ${BACKEND_CONTAINER} did not run through. ` +
        'Is the local instance running (docker ps)?\n' +
        `Cause: ${(error as Error).message}` +
        (stderr ? `\n${stderr}` : ''),
    )
  }
}

/**
 * A JSON-serialisable value as a Python expression: `json.loads('...')` with
 * the value JSON-encoded twice, once for Python's string literal and once for
 * `json.loads`. The snippet has to `import json` itself.
 */
export function pyLiteral(value: unknown): string {
  return `json.loads(${JSON.stringify(JSON.stringify(value))})`
}

/**
 * Asserts that the snippet printed `marker` - the way a snippet reports that it
 * got to its last line, since `manage.py shell` exits with 0 even when the
 * snippet raised.
 */
export function expectOutput(output: string, marker: string, what: string): void {
  if (!output.includes(marker)) {
    throw new Error(`${what}: the snippet did not report "${marker}".\nOutput: ${output.trim()}`)
  }
}

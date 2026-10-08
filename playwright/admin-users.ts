// Placeholder accounts for the images of the administration area (chapters
// 19-24 of part B).
//
// Why this exists: the local instance knows exactly two accounts, and both
// belong to whoever set it up - the Django superuser and the capture account.
// Every list in /admin/auth/user/ shows them with their e-mail address, and a
// published image cannot be recalled (see CLAUDE.md, "Personal data in
// images"). The chapters also need something to show in the first place: one
// account per shipped group, so that 19.1 and 19.5 can point at a group
// membership instead of at an empty list.
//
// The accounts follow the placeholder rule: recognisable at a glance, never a
// plausible-looking invented person. The e-mail addresses use the reserved TLD
// .example, which cannot be registered by anyone.
//
// The accounts are created for the run and removed again afterwards - a spec
// calls seedPlaceholderUsers() in beforeAll and removePlaceholderUsers() in
// afterAll. They are deliberately not part of the setup script: they exist for
// the length of a capture run, not as demo data.
//
// Both go through `manage.py shell` in the backend container, like
// clearDashboardCache() in tests/04-dashboard.spec.ts. The REST API has no
// endpoint for user accounts - they are maintained in the administration area,
// which is exactly what the chapters describe.
import { execFileSync } from 'node:child_process'

const BACKEND_CONTAINER = 'qonnectra_backend_prod'

export interface PlaceholderUser {
  username: string
  firstName: string
  lastName: string
  email: string
  /** Group the account is put into; the instance ships Admin, Editor, Viewer. */
  group: 'Admin' | 'Editor' | 'Viewer'
}

/**
 * One account per shipped group, in the order the chapters use them: the three
 * role profiles of 19.5 ("Betrachten, Bearbeiten, Verwalten").
 */
export const PLACEHOLDER_USERS: PlaceholderUser[] = [
  {
    username: 'e.mustermann',
    firstName: 'Erika',
    lastName: 'Mustermann',
    email: 'e.mustermann@musterstadt.example',
    group: 'Admin',
  },
  {
    username: 'm.mustermann',
    firstName: 'Max',
    lastName: 'Mustermann',
    email: 'm.mustermann@musterstadt.example',
    group: 'Editor',
  },
  {
    username: 'moritz.mustermann',
    firstName: 'Moritz',
    lastName: 'Mustermann',
    email: 'moritz.mustermann@musterstadt.example',
    group: 'Viewer',
  },
]

const USERNAMES = PLACEHOLDER_USERS.map((user) => user.username)

function runInBackend(script: string, what: string): string {
  try {
    return execFileSync(
      'docker',
      ['exec', '-i', BACKEND_CONTAINER, 'python', 'manage.py', 'shell', '-c', script],
      { encoding: 'utf8' },
    )
  } catch (error) {
    throw new Error(
      `${what} failed: docker exec ${BACKEND_CONTAINER} did not run through. ` +
        'Is the local instance running (docker ps)?\n' +
        `Cause: ${(error as Error).message}`,
    )
  }
}

/**
 * Creates the placeholder accounts, or brings them back to the expected state
 * if a previous run was aborted before the cleanup.
 *
 * The accounts get a random password that is thrown away straight after: they
 * never log in, they are only ever looked at. An unusable password would show
 * up as "Kein Passwort gesetzt" in the detail view and make the images lie
 * about how an account is created.
 */
export function seedPlaceholderUsers(): void {
  const script = [
    'import json, secrets',
    'from django.contrib.auth import get_user_model',
    'from django.contrib.auth.models import Group',
    `users = json.loads(${JSON.stringify(JSON.stringify(PLACEHOLDER_USERS))})`,
    'User = get_user_model()',
    'for entry in users:',
    '    user, _ = User.objects.get_or_create(username=entry["username"])',
    '    user.first_name = entry["firstName"]',
    '    user.last_name = entry["lastName"]',
    '    user.email = entry["email"]',
    '    user.is_staff = False',
    '    user.is_superuser = False',
    '    user.is_active = True',
    '    user.set_password(secrets.token_urlsafe(32))',
    '    user.save()',
    '    group = Group.objects.filter(name=entry["group"]).first()',
    '    if group is None:',
    '        raise SystemExit("missing group: " + entry["group"])',
    '    user.groups.set([group])',
    'print("seeded", len(users))',
  ].join('\n')

  const output = runInBackend(script, 'Creating the placeholder accounts')
  if (!output.includes(`seeded ${PLACEHOLDER_USERS.length}`)) {
    throw new Error(
      'The placeholder accounts were not created. Do the groups Admin, Editor ' +
        'and Viewer exist in the instance?\n' +
        `Output: ${output.trim()}`,
    )
  }
}

/**
 * Removes the placeholder accounts again. Runs after the captures, so that the
 * instance is left the way it was found.
 */
export function removePlaceholderUsers(): void {
  const script = [
    'import json',
    'from django.contrib.auth import get_user_model',
    `usernames = json.loads(${JSON.stringify(JSON.stringify(USERNAMES))})`,
    'get_user_model().objects.filter(username__in=usernames).delete()',
    'print("removed")',
  ].join('\n')

  runInBackend(script, 'Removing the placeholder accounts')
}

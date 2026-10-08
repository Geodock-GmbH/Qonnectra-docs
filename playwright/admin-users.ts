// Placeholder accounts for the images of the administration area (chapters
// 19-24, 27 and 28 of part B).
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
// Both go through `manage.py shell` in the backend container
// (playwright/backend-shell.ts). The REST API has no endpoint for user
// accounts - they are maintained in the administration area, which is exactly
// what the chapters describe.
//
// „Mitglied seit“ and „Letzte Anmeldung“ of the user form are pinned here:
// `date_joined` defaults to the moment of creation, and an image of the form
// would otherwise carry the day of the run (see CLAUDE.md, "Dates in the
// Django administration cannot be frozen"). The accounts never log in, so
// `last_login` stays empty on purpose - that is what the form shows for an
// account that was just created.
import { expectOutput, pyLiteral, runInBackend } from './backend-shell'
import { CAPTURE_DATE } from './stable-dates'

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

/**
 * Stored password of every placeholder account, see seedPlaceholderUsers().
 * The digest is SHA-256 of a fixed sentence, not the PBKDF2 of any password.
 */
const PLACEHOLDER_PASSWORD_HASH =
  'pbkdf2_sha256$1000000$Mustermann0Platzhalter$dWopEsZ3cBVNOng0P8R6IlevXMdbwoer6BXKa7nkBfU='

/**
 * Creates the placeholder accounts, or brings them back to the expected state
 * if a previous run was aborted before the cleanup.
 *
 * The accounts get a fixed password hash rather than a password: they never
 * log in, they are only ever looked at. The user form shows the algorithm, the
 * start of the salt and the start of the hash, so a `set_password()` with a
 * fresh random value changed the image on every run. PLACEHOLDER_PASSWORD_HASH
 * is a well-formed PBKDF2 entry whose digest was not derived from any password
 * - it is the SHA-256 of a sentence - so no password opens these accounts
 * while they exist. An unusable password would show up as "Kein Passwort
 * gesetzt" instead and make the images lie about how an account is created.
 */
export function seedPlaceholderUsers(): void {
  const script = [
    'import json',
    'from django.contrib.auth import get_user_model',
    'from django.contrib.auth.models import Group',
    'from django.utils.dateparse import parse_datetime',
    `users = ${pyLiteral(PLACEHOLDER_USERS)}`,
    `joined = parse_datetime(${pyLiteral(CAPTURE_DATE)})`,
    'User = get_user_model()',
    'for entry in users:',
    '    user, _ = User.objects.get_or_create(username=entry["username"])',
    '    user.first_name = entry["firstName"]',
    '    user.last_name = entry["lastName"]',
    '    user.email = entry["email"]',
    '    user.is_staff = False',
    '    user.is_superuser = False',
    '    user.is_active = True',
    '    user.date_joined = joined',
    '    user.last_login = None',
    `    user.password = ${pyLiteral(PLACEHOLDER_PASSWORD_HASH)}`,
    '    user.save()',
    '    group = Group.objects.filter(name=entry["group"]).first()',
    '    if group is None:',
    '        raise SystemExit("missing group: " + entry["group"])',
    '    user.groups.set([group])',
    'print("seeded", len(users))',
  ].join('\n')

  const output = runInBackend(script, 'Creating the placeholder accounts')
  expectOutput(
    output,
    `seeded ${PLACEHOLDER_USERS.length}`,
    'Creating the placeholder accounts (do the groups Admin, Editor and Viewer exist in the instance?)',
  )
}

/**
 * Removes the placeholder accounts again. Runs after the captures, so that the
 * instance is left the way it was found.
 */
export function removePlaceholderUsers(): void {
  const script = [
    'import json',
    'from django.contrib.auth import get_user_model',
    `usernames = ${pyLiteral(USERNAMES)}`,
    'get_user_model().objects.filter(username__in=usernames).delete()',
    'print("removed")',
  ].join('\n')

  runInBackend(script, 'Removing the placeholder accounts')
}

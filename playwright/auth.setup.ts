// Setup-Projekt (läuft automatisch vor allen Specs, siehe playwright.config.ts).
//
// Prüft, dass die lokale Qonnectra-Instanz erreichbar ist, meldet sich mit den
// Zugangsdaten aus local-app/deployment/.env an und legt den angemeldeten
// Zustand in auth-state.json ab. Kein manueller Login-Schritt mehr nötig.
//
// Angemeldet wird sich mit dem Konto OHNE Administrationsrechte
// (APP_USER_USERNAME, Gruppe „Editor“), damit die Bilder die Oberfläche so
// zeigen, wie normale Nutzende sie sehen. Für Bereiche, die nur der
// Superuser sieht, den Lauf mit QONNECTRA_LOGIN=admin starten – dann fehlt
// aber jede Rechteprüfung und der Menüpunkt „Logs“ ist zusätzlich im Bild.
//
// Die Zugangsdaten werden nur an die API geschickt, nie ausgegeben.
//
// auth-state.json wird bei jedem Lauf neu erzeugt und ist absichtlich nicht
// wiederverwendbar: das Backend rotiert Refresh-Tokens und setzt das alte auf
// eine Blacklist (SIMPLE_JWT: ROTATE_REFRESH_TOKENS + BLACKLIST_AFTER_ROTATION),
// das Access-Token lebt 15 Minuten.
import { expect, request as playwrightRequest, test as setup } from '@playwright/test'

import { localApp } from './local-app'

const AUTH_STATE = 'auth-state.json'

/** Projekt „Testprojekt" aus scripts/qonnectra-demo-data/testprojekt-export.json. */
const TESTPROJEKT_ID = '2'

/**
 * Kartenmittelpunkt und Zoom, bei denen das komplette Netz des Testprojekts im
 * Bild liegt. Die Karte hat kein Auto-Fit – sie startet aus diesen Werten im
 * localStorage und stünde ohne Seeding bei Zoom 2 im Atlantik.
 * Koordinaten in EPSG:3857 (Projektion der Kartenansicht).
 */
const KARTE_MITTE = [1083532, 7308590]
const KARTE_ZOOM = 16.5

setup('Anmelden und Zustand speichern', async ({ browser, request }) => {
  const { appUrl, apiUrl, username, password, rolle } = localApp()

  // Nur die Rolle in die Ausgabe, nie der Kontoname – an ihm hängen die
  // Zugangsdaten in .env.
  setup.info().annotations.push({
    type: 'Anmeldung',
    description:
      rolle === 'admin'
        ? 'Django-Superuser (QONNECTRA_LOGIN=admin)'
        : 'Konto ohne Administrationsrechte (Standard)',
  })

  // 1. Erreichbarkeit zuerst prüfen, damit ein nicht laufender Stack nicht als
  //    Login-Fehler erscheint.
  let status: number
  try {
    status = (await request.get(appUrl, { maxRedirects: 0 })).status()
  } catch (error) {
    throw new Error(
      `Die lokale Qonnectra-Instanz ist unter ${appUrl} nicht erreichbar.\n` +
        'Bitte starten mit:\n  scripts/setup-local-qonnectra.sh\n' +
        `Ursache: ${(error as Error).message}`,
    )
  }
  expect(
    status,
    `${appUrl} antwortet mit HTTP ${status}. Läuft der Stack? (scripts/setup-local-qonnectra.sh)`,
  ).toBeLessThan(500)

  // 2. Direkt gegen die API anmelden statt durch das Formular – kein CSRF-Token
  //    nötig und unabhängig vom Aussehen der Login-Seite.
  const apiContext = await playwrightRequest.newContext({
    baseURL: apiUrl,
    ignoreHTTPSErrors: true,
  })
  // Nach einem Neustart des Stacks antwortet Caddy eine Weile mit 502, bis
  // gunicorn im Backend hochgelaufen ist. Das ist kein Fehler des Setups,
  // deshalb wird es eine Minute lang erneut versucht.
  const FRIST_MS = 60_000
  const ABSTAND_MS = 3_000
  const bis = Date.now() + FRIST_MS
  let login = await apiContext.post('/api/v1/auth/login/', { data: { username, password } })
  while (login.status() >= 500 && Date.now() < bis) {
    await new Promise((fertig) => setTimeout(fertig, ABSTAND_MS))
    login = await apiContext.post('/api/v1/auth/login/', { data: { username, password } })
  }

  if (!login.ok()) {
    // Fehlerursachen auseinanderhalten – sonst schickt eine 502 beim Aufwärmen
    // des Stacks auf die falsche Fehlersuche.
    const grund =
      login.status() >= 500
        ? `Das Backend antwortet weiterhin mit HTTP ${login.status()}. Läuft der Stack vollständig?\n` +
          '  docker ps  bzw.  scripts/setup-local-qonnectra.sh\n' +
          'Hält der Zustand an, obwohl der Backend-Container läuft: nginx hat die alte\n' +
          'Container-IP des Backends zwischengespeichert (Log: „Host is unreachable“).\n' +
          'Dann hilft:\n  docker restart qonnectra_nginx_prod'
        : login.status() === 401 || login.status() === 400
          ? rolle === 'admin'
            ? 'Zugangsdaten abgelehnt. Stimmen DJANGO_SUPERUSER_USERNAME/-PASSWORD in ' +
              'local-app/deployment/.env? Neu aufbauen mit:\n' +
              '  scripts/setup-local-qonnectra.sh --reset'
            : 'Zugangsdaten abgelehnt. Das Konto zu APP_USER_USERNAME aus ' +
              'local-app/deployment/.env existiert nicht oder hat ein anderes\n' +
              'Passwort. Das Setup legt es an und setzt das Passwort bei jedem Lauf neu:\n' +
              '  scripts/setup-local-qonnectra.sh'
          : `Unerwartete Antwort HTTP ${login.status()}.`
    throw new Error(`Anmeldung an ${apiUrl}/api/v1/auth/login/ fehlgeschlagen.\n${grund}`)
  }

  const { cookies } = await apiContext.storageState()
  await apiContext.dispose()

  const accessToken = cookies.find((cookie) => cookie.name === 'api-access-token')
  expect(
    accessToken,
    'Die API hat kein api-access-token-Cookie gesetzt – Login-Antwort unerwartet.',
  ).toBeDefined()

  // 3. Cookies in einen Browser-Kontext übernehmen und die Ansicht
  //    deterministisch vorbelegen.
  const context = await browser.newContext({ ignoreHTTPSErrors: true })
  await context.addCookies([
    ...cookies,
    {
      // Steuert, welches Projekt die App zeigt; ein UI-Login würde hier "1"
      // (Projekt „Default") schreiben.
      name: 'selected-project',
      value: TESTPROJEKT_ID,
      domain: new URL(appUrl).hostname,
      path: '/',
      expires: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365,
      httpOnly: false,
      secure: true,
      sameSite: 'Lax',
    },
  ])

  const page = await context.newPage()
  await page.goto(appUrl, { waitUntil: 'domcontentloaded' })

  // Sprache, Hellmodus und Kartenausschnitt liegen im localStorage. Ohne das
  // hängt das Aussehen der Bilder vom letzten Lauf ab.
  await page.evaluate(
    ({ mitte, zoom }) => {
      localStorage.setItem('PARAGLIDE_LOCALE', 'de')
      localStorage.setItem('mode', 'light')
      localStorage.setItem('lightSwitchMode', JSON.stringify('light'))
      localStorage.setItem('basemapTheme', JSON.stringify('light'))
      localStorage.setItem('mapCenter', JSON.stringify(mitte))
      localStorage.setItem('mapZoom', JSON.stringify(zoom))
    },
    { mitte: KARTE_MITTE, zoom: KARTE_ZOOM },
  )

  // 4. Gegenprobe: Zeigt die App wirklich das Testprojekt an?
  await page.goto(`${appUrl}/dashboard`, { waitUntil: 'domcontentloaded' })
  await expect(
    page,
    'Nach dem Login wurde nicht das Testprojekt geöffnet.',
  ).toHaveURL(new RegExp(`/dashboard/${TESTPROJEKT_ID}(/|$)`))

  await context.storageState({ path: AUTH_STATE })
  await context.close()
})

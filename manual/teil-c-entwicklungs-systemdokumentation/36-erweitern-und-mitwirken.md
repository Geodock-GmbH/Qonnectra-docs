# 36. Erweitern und mitwirken

Dieses Kapitel beschreibt die häufigsten Erweiterungen Schritt für Schritt – ein Attribut, ein Modell, eine Route, eine Sprache – und wie ein Beitrag in das Repository und in eine Version gelangt. Es setzt die Kapitel [Entwicklungsumgebung](./30-entwicklungsumgebung.md) bis [Qualitätssicherung](./34-qualitaetssicherung.md) voraus.

Eine Änderung berührt meist mehr Stellen, als ihr Name vermuten lässt. Die Listen unten nennen die Stellen, die zum Stand des Handbuchs regelmäßig dazugehören; überspringen Sie eine, fällt das selten sofort auf, sondern erst in einer anderen Ansicht, in QGIS oder nach der nächsten Installation.

## 36.1 Ein Attribut oder Modell ergänzen

**Ein Attribut an einem bestehenden Modell**, etwa ein neues Feld an der Trasse:

1. **Modell** – das Feld in `backend/apps/api/models.py` ergänzen, mit `verbose_name` als übersetzbarem Text (`_("…")`).
2. **Migration** – `uv run manage.py makemigrations api`, die erzeugte Datei prüfen und mit einchecken. Der Änderungsverlauf bekommt das Feld über django-simple-history automatisch.
3. **Serialisierer** – in `backend/apps/api/serializers.py`. Die Serialisierer der Fachobjekte nennen meist alle Felder (`fields = "__all__"`), die Listen-Serialisierer (`ConduitListSerializer`, `AddressListSerializer`) und die der Stammdaten eine feste Liste; prüfen Sie jeden, der das Modell ausgibt. Fremdschlüssel folgen einem festen Muster: lesend ein verschachtelter Serialisierer, schreibend ein eigenes Feld mit `PrimaryKeyRelatedField`. Beschriftungen setzen manche Serialisierer in `get_fields()`.
4. **Vektorkacheln** – soll das Feld in der Karte erscheinen, zum Beschriften oder Einfärben, ergänzen Sie es im SQL des Kachel-Endpunkts in `views.py` (`OlTrenchTileViewSet` usw.). Die Kacheln enthalten nur die Spalten, die dort ausdrücklich ausgewählt sind, siehe Abschnitt [Vektor-Tile-Endpunkte](./32-rest-api.md#_32-6-vektor-tile-endpunkte).
5. **Administrationsbereich** – in `backend/apps/api/admin.py`, falls das Feld in Liste, Filter oder Suche erscheinen soll. Im Formular steht es von selbst, sofern der Admin keine `fields` oder `fieldsets` festlegt.
6. **Schema und Typen** – `schema.yml` neu erzeugen und `api.d.ts` daraus, siehe Abschnitt [OpenAPI-Schema und Typgenerierung](./32-rest-api.md#_32-7-openapi-schema-und-typgenerierung).
7. **Frontend** – die Anzeige in der Info-Box und in Formularen. Den Feldnamen übersetzt `src/lib/utils/fieldAliases.ts` in eine Beschriftung; der Text dazu gehört in `messages/de.json` und `messages/en.json`.
8. **Übersetzung des Backends** – `uv run manage.py makemessages -l de`, den neuen Eintrag in `backend/locale/de/LC_MESSAGES/django.po` übersetzen, `compilemessages`, siehe Abschnitt [Eine weitere Sprache ergänzen](#_36-3-eine-weitere-sprache-erganzen).
9. **Tests** – die Factory in `backend/apps/api/tests/factories.py` ergänzen, wenn das Feld Pflicht ist, und einen Test für sein Verhalten.

Das GeoPackage-Schema liest die Spalten zur Laufzeit aus der Datenbank und nimmt das Feld ohne weiteres Zutun auf. QGIS sieht die neue Spalte beim nächsten Laden des Layers; Formulare und Stile in hinterlegten QGIS-Projekten müssen Sie aber selbst nachziehen.

::: warning
Ein Pflichtfeld ohne Vorgabewert in der Datenbank lässt jedes Einfügen aus QGIS scheitern, das das Feld nicht kennt. Ein Vorgabewert in Django (`default=`) genügt dem Excel-Import und älteren Fassungen des Frontends, die über Django speichern, nicht aber QGIS, das direkt in die Datenbank schreibt. Geben Sie neuen Feldern deshalb `db_default=` oder erlauben Sie leere Werte (`null=True, blank=True`).
:::

**Ein neues Modell** braucht zusätzlich:

- `db_table` im `Meta`, nach dem Muster der übrigen ohne App-Präfix, siehe Kapitel [Datenmodell des Backends](./31-datenmodell-des-backends.md),
- `history = HistoricalRecords()`, wenn Änderungen nachvollziehbar sein sollen, und im Administrationsbereich `SimpleHistoryAdmin` als Basisklasse,
- ein `ModelViewSet` mit `queryset` auf das neue Modell und `permission_classes = [IsAuthenticated, RoleBasedPermission]`, registriert am Router in `backend/apps/api/urls.py`,
- eine Registrierung in `admin.py`,
- ein Eintrag in `GEOPACKAGE_LAYER_CONFIG` in `backend/apps/api/services.py`, wenn die Tabelle im GeoPackage-Schema erscheinen soll,
- eine **Datenmigration, die die Modellrechte anlegt**.

Der letzte Punkt wird am leichtesten vergessen. `RoleBasedPermission` liest das Recht unter dem Modellnamen in Kleinbuchstaben (`_meta.model_name`) aus `model_permission`. Fehlt dort eine Zeile, hat jede Gruppe die Stufe `none`, und alle Konten außer dem Superuser bekommen 403 – auch beim Lesen, siehe Abschnitt [Rechte, die keine mitgelieferte Rolle enthält](../teil-b-betrieb-admin-qgis/19-rollen-und-rechte.md#_19-6-rechte-die-keine-mitgelieferte-rolle-enthalt). Die Migration `0068` zeigt das Muster, hier als vollständige Migration:

```python
from django.db import migrations


def seed_permissions(apps, schema_editor):
    Group = apps.get_model("auth", "Group")
    ModelPermission = apps.get_model("api", "ModelPermission")
    levels = {"Admin": "full", "Editor": "edit", "Viewer": "view"}
    for group_name, level in levels.items():
        group, _ = Group.objects.get_or_create(name=group_name)
        ModelPermission.objects.get_or_create(
            group=group, model_name="meinmodell", defaults={"access_level": level}
        )


def remove_permissions(apps, schema_editor):
    ModelPermission = apps.get_model("api", "ModelPermission")
    ModelPermission.objects.filter(model_name="meinmodell").delete()


class Migration(migrations.Migration):
    dependencies = [("api", "<vorherige Migration>")]
    operations = [migrations.RunPython(seed_permissions, remove_permissions)]
```

Soll die Datenbank etwas selbst durchsetzen – eine Kennung vergeben, eine Geometrie prüfen –, gehört der Trigger in eine Migration mit `RunSQL` samt `reverse_sql`, nach dem Vorbild der bestehenden, siehe Abschnitt [Migrationen, Datenbank-Trigger und Signale](./31-datenmodell-des-backends.md#_31-9-migrationen-datenbank-trigger-und-signale). Ein Trigger wirkt auch für QGIS, ein Signal nur für Django.

## 36.2 Eine neue Route samt Berechtigung ergänzen

Eine neue Ansicht der Weboberfläche mit eigenem Menüpunkt entsteht so:

1. **Route** – einen Ordner unter `frontend/src/routes/` mit `+page.svelte` und, wenn die Seite Daten lädt, `+page.server.ts`. Braucht die Ansicht das Projekt, legen Sie sie als `neue-ansicht/[[projectId]]` an.
2. **Projekt im Pfad** – den Pfad in zwei Listen aufnehmen, die übereinstimmen müssen: `PROJECT_ROUTES` in `frontend/src/hooks.server.ts`, damit `/neue-ansicht` auf `/neue-ansicht/<Projekt>` umleitet, und `PROJECT_AWARE_ROUTES` in `frontend/src/lib/components/ProjectCombobox.svelte`, damit ein Wechsel des Projekts die Ansicht mitnimmt.
3. **Menüpunkt** – einen Eintrag in `frontend/src/lib/config/navLinks.ts`, in der passenden Gruppe von `navGroups` oder in `footerLinks`, mit einer festen `id`, `href`, der Beschriftung als Text aus Paraglide (`label: () => m.nav_…()`), einem Symbol aus `@tabler/icons-svelte` und `pathMatch`. Unter der `id` merkt sich die Navigationsleiste, ob ein Eintrag ausgeblendet ist; ändern Sie sie später nicht mehr.
4. **Texte** – die Beschriftung in `frontend/messages/de.json` und `frontend/messages/en.json`.
5. **Tests** – mindestens ein Test der Lade-Funktion im Projekt `server` von Vitest.

Ohne weiteren Schritt ist die Route für alle Konten sichtbar: Was keine Zeile in `route_permission` erfasst, ist erlaubt, siehe Abschnitt [Anmeldung, Token-Erneuerung und Routenschutz im Frontend](./33-frontend.md#_33-8-anmeldung-token-erneuerung-und-routenschutz-im-frontend). Soll sie für einzelne Gruppen gesperrt sein, braucht es Zeilen in `route_permission` – zwei je Gruppe, für den Pfad und für `…/*`, siehe Abschnitt [Routenrechte](../teil-b-betrieb-admin-qgis/19-rollen-und-rechte.md#_19-3-routenrechte-zugriff-je-menupunkt). Gehört die Sperre zur Auslieferung, legen Sie diese Zeilen in einer Datenmigration an, nach dem Muster von `0058` (dort genügt eine Zeile für `/admin/*`, weil darunter nur `/admin/logs` liegt).

Die Routenrechte steuern nur das Frontend. Liest oder schreibt die neue Ansicht Daten, gehört der Schutz dieser Daten in das Backend: ein `ViewSet` mit `RoleBasedPermission` statt eines Endpunkts, der nur die Anmeldung prüft, siehe Abschnitt [Ein Attribut oder Modell ergänzen](#_36-1-ein-attribut-oder-modell-erganzen).

## 36.3 Eine weitere Sprache ergänzen

Frontend und Backend übersetzen getrennt; eine neue Sprache braucht beide.

**Frontend (Paraglide)**

1. Die Sprache in `frontend/project.inlang/settings.json` unter `locales` eintragen, etwa `["de", "en", "fr"]`.
2. `messages/fr.json` anlegen, mit allen Schlüsseln aus `messages/de.json`. Die Dateien sind alphabetisch nach Schlüssel sortiert; `.vscode/sort_i18n_json.py` stellt die Ordnung wieder her, aufgerufen aus dem Wurzelverzeichnis des Repositorys oder über die VS-Code-Aufgabe „Sort i18n JSON Files“.
3. Die Stellen anpassen, an denen die Sprachen fest im Code stehen:
   - `src/lib/components/LocaleSwitcher.svelte` – die Liste der Auswahl,
   - `src/lib/components/MobileNav.svelte` – die Schaltflächen der mobilen Ansicht und der Typ `'de' | 'en'`,
   - `src/lib/classes/CableTrenchDataManager.svelte.ts` – die Wahl zwischen deutschem und englischem Farbnamen.

   Eine Suche nach `'de' | 'en'` und `'en'` in `src/` findet sie.

Mikrorohr- und Faserfarben haben nur `name_de` und `name_en`; eine weitere Sprache zeigt einen dieser beiden Namen, solange das Modell keine weitere Spalte bekommt. Zahlen und Datumsangaben formatieren viele Komponenten fest mit `'de-DE'` (`toLocaleString('de-DE')`); sie bleiben in jeder Sprache deutsch formatiert.

Fehlt ein Schlüssel in einer Sprache, zeigt Paraglide den Text der Ausgangssprache Deutsch. Zum Stand des Handbuchs fehlt in `en.json` bereits ein Schlüssel gegenüber `de.json`.

**Backend (gettext von Django)**

1. Die Sprache in `LANGUAGES` in `backend/core/settings.py` ergänzen. Die Einstellung steht dort zweimal, ebenso `LOCALE_PATHS`; die zweite überschreibt die erste. Ändern Sie beide oder entfernen Sie die doppelte.
2. `uv run manage.py makemessages -l fr` erzeugt `backend/locale/fr/LC_MESSAGES/django.po`. Die Quelltexte im Code sind englisch; Deutsch ist selbst eine Übersetzung.
3. Übersetzen Sie die Einträge und kompilieren Sie die Datei mit `uv run manage.py compilemessages`. Checken Sie `.po` und `.mo` ein, wie es für Deutsch geschieht; der Container `backend` der Produktivkonfiguration kompiliert zwar bei jedem Start selbst, die Entwicklungsumgebung nicht. `.vscode/mark_untranslated_po.py` markiert Einträge, die noch nicht übersetzt sind – mit dem Pfad der neuen `.po`-Datei als Argument; ohne Argument bearbeitet es die deutsche.

Welche Sprache das Backend wählt, bestimmt `LocaleMiddleware` von Django aus der Sprache des Browsers (`Accept-Language`), nicht aus dem Sprachschalter der Weboberfläche. Administrationsbereich und Meldungen der Schnittstelle folgen deshalb der Einstellung des Browsers.

Zuletzt gehört die Sprache in `availableLanguages` in `publiccode.yml`.

## 36.4 Beitragsprozess, Versionierung, Releases

**Beiträge** laufen über Forks, nach `CONTRIBUTING.md` im Repository:

1. Das Repository auf GitHub forken, den Fork klonen und das Original als `upstream` eintragen.
2. Je Änderung einen Zweig anlegen, `feature/…` oder `fix/…`, ausgehend vom aktuellen `main`.
3. Commits nach [Conventional Commits](https://www.conventionalcommits.org/) schreiben, siehe unten.
4. Einen Pull Request gegen `main` des Originals öffnen und die Vorlage ausfüllen: Beschreibung, betroffenes Issue, Art der Änderung, betroffene Teile, wie getestet wurde.

Fehler und Wünsche gehören als Issue in das Repository, mit den Vorlagen für Fehlermeldungen und Funktionswünsche; Fragen und Ideen in die Discussions. Issues und Pull Requests dürfen auf Deutsch oder Englisch verfasst sein. Sicherheitslücken gehören nicht in ein Issue, siehe Abschnitt [Sicherheitsaspekte](./35-bereitstellung-und-infrastruktur.md#_35-8-sicherheitsaspekte).

Vor einem Pull Request prüfen Sie selbst, was die CI nicht prüft – die Tests des Backends, ruff, ESLint und Prettier für die geänderten Dateien und ob `schema.yml` zum Backend passt –, siehe Kapitel [Qualitätssicherung](./34-qualitaetssicherung.md).

**Versionierung.** Die Versionsnummer folgt Semantic Versioning und ergibt sich aus den Commits seit der letzten Version:

| Typ des Commits | Wirkung auf die Version | Abschnitt im CHANGELOG |
|---|---|---|
| `feat!:`, `fix!:` usw. oder Fußzeile `BREAKING CHANGE:` | Major (1.7.0 → 2.0.0) | wie der Typ, zusätzlich „⚠ BREAKING CHANGES“ |
| `feat:` | Minor (1.7.0 → 1.8.0) | „Features“ |
| `fix:` | Patch (1.7.0 → 1.7.1) | „Bug Fixes“ |
| `refactor:`, `perf:`, `docs:`, `chore:` | Patch, wenn seit der letzten Version nichts anderes dazukam | „Refactoring“, „Performance“, „Documentation“, „Miscellaneous“ |
| `test:` und andere | keine | keiner |

`CONTRIBUTING.md` nennt für `refactor:`, `perf:`, `docs:` und `chore:` keine Wirkung auf die Version. Weil `release-please-config.json` ihnen aber eigene Abschnitte im CHANGELOG gibt, behandelt release-please sie als Grund für eine neue Version und erhöht dann die Patch-Stelle.

Kennzeichnen Sie eine Änderung, die eine bestehende Installation zu einem Eingriff zwingt – eine neue Pflichtvariable in `.env`, eine Migration, die Daten umbaut –, als Breaking Change (`feat!:`). Betreibende erfahren davon nur aus dem CHANGELOG, siehe Abschnitt [Aktualisierung auf eine neue Version](../teil-b-betrieb-admin-qgis/28-betrieb-der-instanz.md#_28-3-aktualisierung-auf-eine-neue-version).

**Releases** erzeugt release-please (`.github/workflows/release-please.yml`, eingestellt in `release-please-config.json` und `.release-please-manifest.json`):

1. Jeder Push auf `main` legt einen Release-Pull-Request an oder aktualisiert ihn, mit der nächsten Versionsnummer und dem CHANGELOG seit der letzten Version.
2. Der Pull Request setzt die neue Nummer in `VERSION`, `frontend/package.json`, `backend/pyproject.toml` und `publiccode.yml`. Ein zweiter Schritt des Workflows setzt das `releaseDate` in `publiccode.yml` und erneuert `backend/uv.lock`.
3. Wer den Pull Request zusammenführt, veröffentlicht die Version: release-please legt das Tag `vX.Y.Z` und ein Release auf GitHub an.

Das Tag ist alles, was eine Version ausmacht. Images baut und veröffentlicht der Ablauf nicht; Betreibende bauen sie auf ihrem Server aus dem Tag, siehe Abschnitt [Container und Images](./35-bereitstellung-und-infrastruktur.md#_35-2-container-und-images). Die Versionsnummer in der Kopfzeile der Weboberfläche liest das Frontend aus `frontend/package.json`; ein Build zwischen zwei Releases zeigt deshalb die Nummer der letzten Version.

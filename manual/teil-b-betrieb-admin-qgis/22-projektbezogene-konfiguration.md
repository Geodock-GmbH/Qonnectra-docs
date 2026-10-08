# 22. Projektbezogene Konfiguration

Drei Ansichten der Weboberfläche hängen von Einstellungen ab, die je Projekt im Administrationsbereich hinterlegt werden: das Netzschema, die Rohrverzweigung und die Wertermittlung. Dazu kommen zwei Einstellungen, die nicht an ein Projekt gebunden sind: die Zusammenstellung des GeoPackage-Schemas und die gespeicherten Einstellungen der Nutzenden.

Die drei Projekteinstellungen pflegen Sie am bequemsten im Formular des Projekts unter „Api“ → „Projekte“, wo sie unter den Feldern des Projekts stehen, siehe Abschnitt [Projekte anlegen und Vorbelegungen setzen](./21-projekte-und-stammdaten.md#_21-1-projekte-anlegen-und-vorbelegungen-setzen). Jede hat außerdem eine eigene Liste: „Netzwerkschema“, „Rohrverzweigung“ und „Wertermittlungssätze“.

Die Projektliste zeigt in drei Spalten, was eingerichtet ist: „Ausgeschlossene Netzknotentypen“ und „Netzknotentypen“ aus den Netzschema-Einstellungen, „Rohrverzweigungs-Typen“ aus den Rohrabzweig-Einstellungen. Die Spalte „Netzknotentypen“ meint die Typen mit der Schaltfläche „Subnetz öffnen“. „Keine“ oder „Keine konfiguriert“ heißt, die Einstellung ist angelegt, aber leer; „Nicht konfiguriert“ heißt, sie fehlt ganz. Der Unterschied ist wichtig, siehe Abschnitt [Einstellungen der Rohrverzweigung](#_22-2-einstellungen-der-rohrverzweigung).

![Screenshot der Liste der Projekte im Administrationsbereich mit Hervorhebung der drei Spalten zu den Projekteinstellungen rechts](/images/manual/teil-b/admin_project_list.jpg)

## 22.1 Netzschema-Einstellungen

Die **Netzschema-Einstellungen** legen fest, welche Netzknoten das Netzschema eines Projekts zeigt, siehe Kapitel [Netzschema](../teil-a-anwenderhandbuch/14-netzschema.md). Sie haben zwei Auswahlfelder:

- „Ausgeschlossene Netzknotentypen“ – Netzknoten dieser Typen erscheinen nicht im Schema. Üblich sind die Hausanschlüsse, deren Zahl das Schema unübersichtlich machen würde.
- „Kindansicht aktivierte Netzknotentypen“ – an Netzknoten dieser Typen erscheint die Schaltfläche „Subnetz öffnen“, siehe Abschnitt [Subnetz eines Netzknotens](../teil-a-anwenderhandbuch/14-netzschema.md#_14-9-subnetz-eines-netzknotens). Der Hilfetext unter dem Feld nennt die Schaltfläche „Hausanschlusskabel-Schema öffnen“; gemeint ist „Subnetz öffnen“.

![Screenshot der Netzschema-Einstellungen eines Projekts mit Hervorhebung der beiden Auswahlfelder untereinander](/images/manual/teil-b/admin_schema_settings.jpg)

Markieren Sie einen Typ in der linken Liste und verschieben Sie ihn mit dem Pfeil nach rechts.

::: info
Fehlen die Netzschema-Einstellungen, meldet das Netzschema beim Öffnen „Die Netzschema-Einstellungen sind für dieses Projekt nicht konfiguriert. Bitte konfigurieren Sie diese im Admin-Bereich.“, zeigt alle Netzknoten des Projekts, und „Subnetz öffnen“ erscheint nirgends. Sind sie angelegt, aber leer, gilt dasselbe ohne die Meldung.
:::

## 22.2 Einstellungen der Rohrverzweigung

Die **Rohrabzweig-Einstellungen** legen fest, welche Netzknoten die Rohrverzweigung als Rohrabzweig anbietet, siehe Kapitel [Rohrverzweigung](../teil-a-anwenderhandbuch/12-rohrverzweigung.md). Ihr einziges Feld ist „Erlaubte Netzknotentypen“.

![Screenshot der Rohrabzweig-Einstellungen eines Projekts mit Hervorhebung des Feldes „Erlaubte Netzknotentypen“](/images/manual/teil-b/admin_pipe_branch_settings.jpg)

Es gibt drei Zustände, und nur zwei davon sind gewollt:

- **Keine Einstellungen** – die Rohrverzweigung bietet alle Netzknoten des Projekts an und weist mit „Rohrabzweig-Einstellungen für dieses Projekt nicht konfiguriert.“ darauf hin.
- **Einstellungen mit mindestens einem Typ** – angeboten werden nur Netzknoten dieser Typen.
- **Einstellungen ohne Typ** – angeboten wird kein einziger Netzknoten, ohne Hinweis.

::: warning
Wer die Einstellungen anlegt und das Feld leer lässt, sperrt die Rohrverzweigung für das Projekt, und die Weboberfläche sagt nicht warum. Wählen Sie mindestens einen Typ aus, oder löschen Sie die Einstellungen wieder.

Eine neue Installation steht für das Projekt „Default“ genau in diesem Zustand: Sie bringt leere Rohrabzweig- und Netzschema-Einstellungen mit. Wählen Sie dort Typen aus, bevor das Projekt genutzt wird.
:::

## 22.3 Kostensätze der Wertermittlung

Die Wertermittlung rechnet mit den Kostensätzen des Projekts; was sie daraus macht, beschreibt Abschnitt [Woher die Kostensätze kommen](../teil-a-anwenderhandbuch/09-wertermittlung.md#_9-3-woher-die-kostensatze-kommen). Sie stehen unter „Wertermittlungssätze“, eine Zeile je Kostenbereich. Eine neue Installation bringt keine mit; ohne sie lässt sich die Wertermittlung nicht benutzen.

![Screenshot der Wertermittlungssätze, gefiltert auf ein Projekt, mit Kostenbereich, Betrag, Einheit und Hausanschluss-Kennzeichnung](/images/manual/teil-b/admin_cost_rates.jpg)

Ein Kostensatz hat diese Felder:

- „Kostenkategorie“ – der Name, der in der Wertermittlung als Kostenbereich erscheint. Er ist je Projekt eindeutig.
- „Betrag“ – in Euro, netto oder brutto nach Ihrer Festlegung; Qonnectra rechnet ihn nicht um.
- „Einheit“ – „pro Meter“ oder „Stück“.
- „Hausanschluss“ – zählt die Netzknoten dieses Satzes für die Kennzahl „Kosten pro Hausanschluss“.
- „Netzknotentypen“ – bei „Stück“ die Typen, deren Netzknoten gezählt werden.

![Screenshot des Formulars eines Kostensatzes mit Hervorhebung von Einheit, Hausanschluss und Netzknotentypen](/images/manual/teil-b/admin_cost_rate_form.jpg)

::: warning
Wählen Sie bei „Stück“ mindestens einen Netzknotentyp aus. Ohne ihn geht der Satz ohne Hinweis mit 0 € ein, siehe Abschnitt [Woher die Kostensätze kommen](../teil-a-anwenderhandbuch/09-wertermittlung.md#_9-3-woher-die-kostensatze-kommen).
:::

Ein Netzknotentyp gehört sinnvollerweise zu genau einem Kostensatz. Steht er in zweien, zählt jeder seiner Netzknoten doppelt.

## 22.4 GeoPackage-Schema konfigurieren

Ein **GeoPackage-Schema** ist eine leere GeoPackage-Datei mit dem Aufbau der Qonnectra-Tabellen. Sie dient als Vorlage für Daten, die außerhalb erfasst und später übernommen werden, siehe Abschnitt [GeoPackage-Schema herunterladen](./24-daten-import-und-export.md#_24-2-geopackage-schema-herunterladen). Welche Tabellen sie enthält, legt eine **Konfiguration** fest. Sie steht unter „GeoPackage-Schema-Konfigurationen“ und gilt für die ganze Installation.

![Screenshot einer GeoPackage-Schema-Konfiguration mit Hervorhebung der Auswahl der Layer](/images/manual/teil-b/admin_geopackage_config.jpg)

Eine Konfiguration hat einen Namen und unter „Ausgewählte Layer“ die Liste der Tabellen. Zur Auswahl stehen:

- die vier Layer mit Geometrie – „trench“, „node“, „address“ und „area“ –, in der Liste mit dem Geometrietyp in Klammern,
- die Fachtabellen ohne Geometrie – „conduit“, „microduct“, „cable“ –,
- die Stammdaten, deren Werte in den Layern als Nummern stehen, etwa „attributes_status“ oder „attributes_node_type“, sowie „projects“ und „flags“.

Legen Sie mehrere Konfigurationen an, wenn verschiedene Aufgaben verschiedene Tabellen brauchen, etwa eine für die Feldaufnahme von Adressen und eine für Trassen.

## 22.5 Benutzereinstellungen zurücksetzen

Unter „Benutzereinstellungen“ steht für jedes Konto, das seine Einstellungen einmal mit „In Konto speichern“ abgelegt hat, eine Zeile mit diesem Speicherstand, siehe Abschnitt [Einstellungen im Konto speichern und wieder laden](../teil-a-anwenderhandbuch/17-einstellungen.md#_17-2-einstellungen-im-konto-speichern-und-wieder-laden).

![Screenshot der Liste der Benutzereinstellungen mit dem Speicherstand eines Kontos oben im Inhaltsbereich](/images/manual/teil-b/admin_user_settings.jpg)

Löschen Sie eine Zeile, ist der Speicherstand des Kontos entfernt. Das ist der Weg, wenn ein gespeicherter Stand Fehler verursacht, etwa weil er nach einer Aktualisierung von Qonnectra Einstellungen enthält, mit denen die Anwendung nicht mehr zurechtkommt.

::: warning
Das Löschen setzt nichts zurück, was die Person gerade sieht. Ihre Einstellungen liegen im Browser, und dort bleiben sie. „Aus Konto laden“ findet danach nichts, ändert nichts und meldet das nicht. Damit die Ausgangswerte wieder gelten, setzt die Person sie in „Einstellungen“ selbst zurück oder löscht die Browserdaten der Anwendung.
:::

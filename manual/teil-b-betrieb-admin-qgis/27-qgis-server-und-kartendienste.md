# 27. QGIS-Server und Kartendienste

Zu Qonnectra gehört ein **QGIS-Server**. Er veröffentlicht die Netzdaten als standardisierte Kartendienste, die jedes GIS lesen kann – QGIS am Arbeitsplatz, das GIS einer Kommune, ein Planungsbüro. Was er zeigt, legt ein **QGIS-Projekt** fest, das Sie im Administrationsbereich hinterlegen. Umgekehrt binden Sie dort **externe Kartendienste** ein, die in der Karte der Weboberfläche als zusätzliche Layer erscheinen.

## 27.1 QGIS-Projekte in Qonnectra hinterlegen

QGIS-Projekte stehen im Administrationsbereich unter „Api“ → „QGIS Projekte“.

![Screenshot der Liste der QGIS-Projekte mit Anzeigename, Name, Erstellungsdatum und Konto im Inhaltsbereich](/images/manual/teil-b/qgis_projects.jpg)

Ein Projekt legen Sie mit „QGIS Projekt hinzufügen“ an:

- „Projekt“ – trotz der Beschriftung der technische Name, der in den Adressen der Dienste erscheint. Nur Kleinbuchstaben, Ziffern, Binde- und Unterstriche, etwa `netzdokumentation`.
- „Anzeigename“ – der Name in der Liste – und eine „Beschreibung“.
- „QGIS Projektdatei“ – die Datei aus QGIS, `.qgs` oder `.qgz`.
- Unter „Feature-Dateien“ – trotz der Beschriftung Datendateien, die das Projekt neben der Datenbank braucht, etwa ein Plan als `.dxf` oder ein Gebiet als `.geojson`.

Das Projekt erstellen Sie in QGIS am Arbeitsplatz, mit Layern aus der Datenbank von Qonnectra, siehe Kapitel [QGIS-Arbeitsplatz einrichten](./25-qgis-arbeitsplatz-einrichten.md). Beim Hochladen stellt Qonnectra die Layer auf den PostgreSQL-Dienst des Servers um: Layer, die auf GeoPackage-Dateien verweisen, zeigen danach auf die gleichnamige Tabelle der Datenbank, Layer aus hochgeladenen Datendateien auf deren Ablage auf dem Server. Anschließend prüft es das Projekt und meldet das Ergebnis über dem Formular.

![Screenshot des Formulars eines QGIS-Projekts mit Hervorhebung der Meldungen nach dem Hochladen oben](/images/manual/teil-b/qgis_project_messages.jpg)

Die Meldungen:

- „QGIS Projekt erfolgreich gespeichert. Bitte starten Sie den QGIS Server manuell mit docker-compose neu.“ – erscheint bei jedem Speichern. Ein Neustart ist nicht nötig: Der Server liest ein neues wie ein geändertes Projekt beim nächsten Abruf.
- „GetCapabilities response does not look like a valid WMS document …“ – erscheint in der ausgelieferten Fassung bei jedem Hochladen, weil die Prüfung den Server unter einer falschen Adresse abfragt. Sie sagt nichts über das Projekt.
- Meldungen zu fehlenden Datenquellen, ungültigen GeoPackage-Dateien oder einer neueren QGIS-Version – diese sind ernst zu nehmen. Das Projekt ist trotzdem gespeichert.

::: warning
Das Projekt ist mit dem Speichern veröffentlicht, auch wenn die Prüfung Fehler meldet. Testen Sie die Dienste nach dem Hochladen in QGIS, bevor Sie die Adresse weitergeben.
:::

Die Aktion „Mit PostgreSQL-Datenquellen herunterladen“ liefert ein hinterlegtes Projekt so zurück, wie der Server es verwendet, zum Öffnen am Arbeitsplatz. Dafür braucht der Arbeitsplatz den PostgreSQL-Dienst `qonnectra`, siehe Abschnitt [Verbindung zur PostGIS-Datenbank](./25-qgis-arbeitsplatz-einrichten.md#_25-2-verbindung-zur-postgis-datenbank-und-zu-den-diensten).

## 27.2 Angebotene Dienste: WMS, WFS, WMTS, OGC API Features

Der QGIS-Server bietet jedes hinterlegte Projekt über diese Dienste an:

- **WMS** – Kartenbilder, zum Anzeigen.
- **WFS** – die Objekte selbst mit ihren Attributen, zum Abfragen und Weiterverarbeiten.
- **WMTS** – Kartenbilder in Kacheln, unter derselben Adresse wie der WMS mit `SERVICE=WMTS`.
- **OGC API Features** – die Objekte als GeoJSON über eine REST-Schnittstelle.

Die Adressen eines Projekts stehen in seinem Formular unter „Zugriffs-URLs“.

![Screenshot des Formulars eines QGIS-Projekts mit Hervorhebung der Zugriffs-URLs für WMS, WFS und OGC API Features](/images/manual/teil-b/qgis_project_form.jpg)

„WMS-URL“ und „WFS-URL“ nennen nur den hinteren Teil der Adresse. Vollständig lauten sie mit der Adresse des QGIS-Servers davor, etwa:

`https://qgis.ihre-domain.de/ows/?SERVICE=WMS&MAP=/projects/netzdokumentation.qgs`

„WFS3-URL (OGC API Features)“ ist ein Pfad auf der Adresse der Schnittstelle, etwa `https://api.ihre-domain.de/api/v1/wfs3/netzdokumentation/`.

::: info
Die Dienste liefern, was das QGIS-Projekt enthält, mit dessen Filtern und Stilen. Soll eine Stelle nur ein Projekt oder nur bestimmte Layer sehen, hinterlegen Sie dafür ein eigenes QGIS-Projekt, das nur diese enthält.
:::

## 27.3 Authentifizierung der Dienste

Die Dienste verlangen eine Anmeldung mit Benutzername und Passwort eines Qonnectra-Kontos. In QGIS tragen Sie beide in der WMS- oder WFS-Verbindung unter „Authentifizierung“ als „Basic“ ein. Ohne Anmeldung antwortet der Server mit „401“.

::: warning
Die Dienste kennen keine Rollen. Jedes aktive Konto sieht jedes hinterlegte QGIS-Projekt mit allen Layern, auch ein Konto der Rolle „Viewer“ und eines ohne Gruppe. Einschränken lässt sich das nur über den Inhalt der Projekte, siehe den Hinweis in Abschnitt [Angebotene Dienste](#_27-2-angebotene-dienste-wms-wfs-wmts-ogc-api-features).
:::

Für eine Stelle, die die Dienste dauerhaft abrufen soll, etwa das GIS einer Kommune, legen Sie ein eigenes Konto ohne Gruppe an. Es öffnet die Dienste, sieht aber in der Weboberfläche keine Daten, siehe Abschnitt [Benutzende und Gruppen anlegen](./19-rollen-und-rechte.md#_19-1-benutzende-und-gruppen-anlegen).

## 27.4 Externe WMS-Quellen als Hintergrund einbinden

Externe Kartendienste – Luftbilder, Liegenschaftskarten, Bebauungspläne – binden Sie als **WMS-Quelle** ein. Ihre Layer erscheinen in der Legende der Karte als eigene Gruppe, siehe Abschnitt [Das Kartenfenster](../teil-a-anwenderhandbuch/03-wiederkehrende-bedienelemente.md#_3-3-das-kartenfenster). Die Quellen stehen unter „Api“ → „WMS-Layer“ – trotz der Beschriftung die Quellen, nicht die einzelnen Layer.

Eine Quelle gehört zu genau einem Projekt. Ihre Felder:

- „Projekt“ und „Name“ – der Name ist die Überschrift der Gruppe in der Legende.
- „WMS-URL“ – die Adresse des Dienstes, mit festen Parametern wie `MAP` darin.
- „Reihenfolge“ und „Aktiv“.
- Unter „Authentifizierung“ „Benutzer“ und „Passwort“, falls der Dienst eine Anmeldung verlangt. Das Passwort wird verschlüsselt gespeichert.
- Unter „PDF-Export“ die „Attribution“ – der Quellenvermerk, den die Lizenz des Dienstes verlangt. Ohne ihn erscheint der Dienst nicht in PDF-Exporten.

Beim Speichern einer neuen Quelle oder einer geänderten Adresse fragt Qonnectra die Layer des Dienstes ab und listet sie darunter auf. Je Layer legen Sie fest, ob er „Aktiviert“ ist, in welcher „Reihenfolge“ er steht, ab und bis zu welcher Zoomstufe er erscheint und wie deckend er ist – die Spalte „Transparenz“ meint die Deckkraft: 1 ist undurchsichtig.

![Screenshot einer WMS-Quelle mit Hervorhebung der Felder oben und der abgefragten Layer darunter](/images/manual/teil-b/qgis_wms_source.jpg)

Die Aktion „Empfohlene Einstellungen scannen und anwenden“ setzt die minimale Zoomstufe jedes Layers nach dessen Ausdehnung, sodass ein großflächiger Dienst nicht schon in der Übersicht der Karte angefragt wird.

::: warning
Die Gruppe erscheint in der Legende nur für Konten, die das Recht `wmssource` haben, und das hat keine mitgelieferte Rolle. Fügen Sie es den Gruppen hinzu, die den Dienst sehen sollen, siehe Abschnitt [Rechte, die keine mitgelieferte Rolle enthält](./19-rollen-und-rechte.md#_19-6-rechte-die-keine-mitgelieferte-rolle-enthalt). Ohne das Recht sieht nur das Superuser-Konto den Dienst.
:::

::: info
Auch der eigene QGIS-Server lässt sich als Quelle eintragen, etwa um einen Plan aus einem hinterlegten Projekt in der Karte zu zeigen. Die Karte fragt ihn über die öffentliche Adresse ab und braucht dafür unter „Authentifizierung“ die Zugangsdaten eines Kontos, wie in Abschnitt [Authentifizierung der Dienste](#_27-3-authentifizierung-der-dienste) beschrieben.
:::

## 27.5 WMS-Proxy und Zwischenspeicher

Die Karte fragt externe Dienste nicht selbst ab, sondern über Qonnectra. Dieser **WMS-Proxy** hält die Zugangsdaten vom Browser fern und speichert jedes abgerufene Kartenbild 30 Tage zwischen. Ein Bildausschnitt, den schon jemand angesehen hat, lädt deshalb sofort, auch wenn der Dienst langsam ist.

::: warning
Ändert sich der Inhalt des externen Dienstes, zeigt die Karte bis zu 30 Tage lang die alten Bilder. Soll ein neuer Stand sofort sichtbar sein, muss der Betrieb den Zwischenspeicher leeren, siehe Abschnitt [Häufige Störungen und ihre Behebung](./28-betrieb-der-instanz.md#_28-7-haufige-storungen-und-ihre-behebung).
:::

Der Zwischenspeicher lässt sich vorab füllen, damit auch der erste Aufruf schnell ist: Der Befehl `warm_wms_cache` ruft die Kartenbilder aller aktiven Quellen für die Zoomstufen 10 bis 14 ab. Der Betrieb führt ihn aus:

```bash
docker compose exec backend python manage.py warm_wms_cache
```

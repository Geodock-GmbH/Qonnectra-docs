# 25. QGIS-Arbeitsplatz einrichten

Die Geometrie des Netzes – der Verlauf der Trassen, die Lage der Netzknoten und Adressen, der Zuschnitt der Gebiete – wird nicht in der Weboberfläche bearbeitet, sondern in **QGIS**. Dieses Kapitel beschreibt, was ein QGIS-Arbeitsplatz für Qonnectra braucht: die Version, die Verbindung zu den Daten und den Aufbau der Layer. Wie Sie QGIS installieren, bedienen und Layer gestalten, beschreibt die [Dokumentation von QGIS](https://docs.qgis.org/latest/de/docs/user_manual/), auf die dieses Kapitel verweist, statt sie zu wiederholen.

## 25.1 Voraussetzungen und geprüfte QGIS-Versionen

Qonnectra wird mit QGIS Server 3.44 ausgeliefert. Verwenden Sie am Arbeitsplatz dieselbe Hauptversion, die Langzeitversion 3.44.

::: warning
Ein QGIS-Projekt, das mit einer neueren Version gespeichert wurde als der des QGIS-Servers, kann Einstellungen enthalten, die der Server nicht kennt. Qonnectra warnt beim Hochladen eines solchen Projekts, sofern die Version des Servers in der Konfiguration hinterlegt ist, siehe Abschnitt [Konfiguration über Umgebungsvariablen](./28-betrieb-der-instanz.md#_28-2-konfiguration-uber-umgebungsvariablen), nimmt es aber in jedem Fall an. Wer Projekte für den Server pflegt, arbeitet deshalb mit derselben Version wie der Server.
:::

Für die Arbeit an den Daten brauchen Sie außerdem:

- ein Konto in Qonnectra für die Dienste des QGIS-Servers,
- für die direkte Verbindung zur Datenbank die Zugangsdaten des Datenbankbenutzers für QGIS und einen VPN-Zugang, die Ihnen der Betrieb Ihrer Installation gibt, siehe Kapitel [Betrieb der Instanz](./28-betrieb-der-instanz.md).

## 25.2 Verbindung zur PostGIS-Datenbank und zu den Diensten

Es gibt zwei Wege zu den Daten, für zwei Zwecke.

**Die Dienste des QGIS-Servers** liefern Karten und Objekte zum Ansehen. Sie stehen unter einer eigenen Adresse, die mit `qgis.` beginnt, und brauchen den Parameter `MAP` mit dem Namen eines hinterlegten Projekts:

`https://qgis.ihre-domain.de/ows/?MAP=/projects/netzdokumentation.qgs`

Diese Adresse tragen Sie in QGIS als neue WMS- oder WFS-Verbindung ein. Als Anmeldung verwenden Sie Benutzername und Passwort Ihres Qonnectra-Kontos. Welche Projekte hinterlegt sind und wie ihre Adressen lauten, zeigt der Administrationsbereich, siehe Abschnitt [QGIS-Projekte in Qonnectra hinterlegen](./27-qgis-server-und-kartendienste.md#_27-1-qgis-projekte-in-qonnectra-hinterlegen).

**Die direkte Verbindung zur Datenbank** dient dem Bearbeiten. Die Datenbank ist aus dem Internet nicht erreichbar; der Weg führt über das VPN der Installation (WireGuard). Ist das VPN verbunden, legen Sie in QGIS eine PostgreSQL-Verbindung an:

| Feld | Wert |
|---|---|
| Host | `10.13.13.1` |
| Port | `5432` |
| Datenbank | vom Betrieb genannt |
| Benutzername und Passwort | die des Datenbankbenutzers für QGIS, vom Betrieb genannt |
| SSL-Modus | „deaktivieren“ |

Wie eine PostgreSQL-Verbindung in QGIS angelegt wird, beschreibt die QGIS-Dokumentation im Kapitel [PostGIS-Layer](https://docs.qgis.org/latest/de/docs/user_manual/managing_data_source/opening_data.html#creating-a-stored-connection).

::: warning
Der Datenbankbenutzer für QGIS darf in allen Tabellen lesen, anlegen, ändern und löschen, auch in denen der Benutzerkonten und der Rechte. Die Rollen aus Kapitel [Rollen und Rechte](./19-rollen-und-rechte.md) gelten für ihn nicht. Wer diese Zugangsdaten hat, kann jede Trasse jedes Projekts löschen und jedem Konto Administrationsrechte geben – sie kommen einem Administrationszugang gleich. Geben Sie sie nur an Personen, denen Sie auch die Administration der Installation anvertrauen.
:::

::: info
Hinterlegte QGIS-Projekte verweisen auf die Datenbank über einen PostgreSQL-Dienst mit dem Namen `qonnectra`. Wollen Sie ein solches Projekt am Arbeitsplatz öffnen, legen Sie einen gleichnamigen Dienst in der Datei `pg_service.conf` Ihres Rechners an, mit den Werten der Tabelle oben. Ohne ihn findet QGIS die Layer nicht.

Umgekehrt muss ein Projekt, das Sie für den QGIS-Server erstellen, seine Layer bereits über diesen Dienst laden und nicht über eine Verbindung mit Host `10.13.13.1`: Der Server erreicht die Adresse des VPN nicht, und Qonnectra stellt PostgreSQL-Layer beim Hochladen nicht um, siehe Abschnitt [QGIS-Projekte in Qonnectra hinterlegen](./27-qgis-server-und-kartendienste.md#_27-1-qgis-projekte-in-qonnectra-hinterlegen).
:::

## 25.3 Layer, Koordinatenbezugssystem und Stile

Alle Geometrien liegen im Koordinatenbezugssystem der Installation, üblicherweise ETRS89 / UTM Zone 32N (EPSG:25832). Setzen Sie das QGIS-Projekt auf dasselbe System; sonst rechnet QGIS jede Bearbeitung um.

Diese vier Tabellen enthalten die Geometrie des Netzes und werden als Layer geladen:

| Tabelle | Geometrie | Inhalt |
|---|---|---|
| `trench` | Linie | Trassen |
| `node` | Punkt | Netzknoten |
| `address` | Punkt | Adressen |
| `area` | Fläche | Gebiete |

Eine Geometrie hat außerdem `pipeline_inquiry_area`, die Auskunftsbereiche der Leitungsauskunft. Sie werden in der Weboberfläche gezeichnet, siehe Kapitel [Leitungsauskunft](../teil-a-anwenderhandbuch/08-leitungsauskunft.md).

Jede Tabelle enthält die Objekte aller Projekte. Setzen Sie am Layer einen Filter auf die Spalte `project` mit der Nummer Ihres Projekts, siehe Abschnitt [Projekte anlegen](./21-projekte-und-stammdaten.md#_21-1-projekte-anlegen-und-vorbelegungen-setzen); sonst bearbeiten Sie versehentlich ein fremdes Projekt.

Neben `geom` hat jede dieser Tabellen eine zweite Geometriespalte, `geom_3857`. Qonnectra berechnet sie selbst für die Karte der Weboberfläche. Laden Sie die Layer immer mit der Spalte `geom`; die zweite lässt sich nicht bearbeiten.

Stammdaten wie Status oder Netzknotentyp stehen in diesen Tabellen als Nummern. Laden Sie die zugehörigen Tabellen – etwa `attributes_status` oder `attributes_node_type` – ohne Geometrie dazu und richten Sie im Layer für die Spalte eine Wertbeziehung zu der Tabelle ein; dann zeigt QGIS die Bezeichnungen und bietet sie beim Bearbeiten zur Auswahl. Das beschreibt die QGIS-Dokumentation unter [Bearbeitungselement Wertbeziehung](https://docs.qgis.org/latest/de/docs/user_manual/working_with_vector/vector_properties.html#edit-widgets).

Einen fertigen Aufbau mit Verbindungen, Filtern und Stilen erhalten Sie am einfachsten aus einem QGIS-Projekt, das Ihre Administration im Administrationsbereich hinterlegt hat: Die Aktion „Mit PostgreSQL-Datenquellen herunterladen“ liefert es zum Öffnen am Arbeitsplatz, siehe Abschnitt [QGIS-Projekte in Qonnectra hinterlegen](./27-qgis-server-und-kartendienste.md#_27-1-qgis-projekte-in-qonnectra-hinterlegen).

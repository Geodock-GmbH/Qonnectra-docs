# 20. Der Administrationsbereich

Im **Administrationsbereich** pflegen Sie alles, was die Weboberfläche nicht anbietet: Konten und Rechte, Stammdaten, die Einstellungen eines Projekts, Kartendienste und die Systemprotokolle. Er ist eine eigene Anwendung neben der Weboberfläche, mit eigener Adresse und eigener Anmeldung.

![Screenshot der Startseite des Administrationsbereichs mit der Liste aller Bereiche](/images/manual/teil-b/admin_index.jpg)

## 20.1 Zugang, Aufbau und Abgrenzung zur Weboberfläche

Der Administrationsbereich hat eine eigene Adresse. Sie beginnt mit `admin.` statt mit `app.` und endet auf `/admin/`, etwa `https://admin.ihre-domain.de/admin/`. Die genaue Adresse Ihrer Installation nennt Ihnen die für den Betrieb zuständige Stelle, siehe Kapitel [Betrieb der Instanz](./28-betrieb-der-instanz.md).

::: warning
Die Anmeldung der Weboberfläche gilt hier nicht. Sie melden sich im Administrationsbereich gesondert an, mit demselben Benutzernamen und Passwort. Hinein kommt nur ein Konto mit „Mitarbeiter-Status“, und arbeiten kann darin in der Praxis nur das Superuser-Konto, siehe Abschnitt [Superuser gegenüber Gruppenmitgliedschaft](./19-rollen-und-rechte.md#_19-4-superuser-gegenuber-gruppenmitgliedschaft).
:::

Die Startseite listet alle Bereiche. Der Kasten „Neueste Aktionen“ daneben zeigt nur Ihre eigenen Änderungen im Administrationsbereich, nicht die anderer Konten.

![Screenshot der Startseite des Administrationsbereichs mit Beschriftung der Kopfzeile oben, der Sprachauswahl oben rechts, der Bereichsliste links und des Kastens „Neueste Aktionen“ daneben](/images/manual/teil-b/admin_index_annotated.jpg)

Auf allen übrigen Seiten steht die Bereichsliste links am Rand, als Navigationsleiste des Administrationsbereichs.

Fast alles steht unter der Überschrift „Api“, Konten und Gruppen unter „Authentifizierung und Autorisierung“. Die Blöcke „Auth Token“ und „Token Blacklist“ verwaltet Qonnectra selbst; dort ist nichts zu tun.

Die Namen der Bereiche weichen teils von den Begriffen der Weboberfläche und dieses Handbuchs ab:

| Administrationsbereich | Weboberfläche und Handbuch |
|---|---|
| „Gräben“ | Trassen |
| „Feature-Dateien“ | Anhänge |
| „Wohnungseinheiten“, „Wohnungseinheit-Typen“, „Wohnungseinheit-Status“ | Wohneinheiten mit Typ und Status |
| „Bau-/Verlegearten“ | Bauart einer Trasse |
| „Netzwerkschema“ | Netzschema-Einstellungen, siehe Abschnitt [Netzschema-Einstellungen](./22-projektbezogene-konfiguration.md#_22-1-netzschema-einstellungen) |
| „Rohrverzweigung“ | Rohrabzweig-Einstellungen, siehe Abschnitt [Einstellungen der Rohrverzweigung](./22-projektbezogene-konfiguration.md#_22-2-einstellungen-der-rohrverzweigung) |
| „Wertermittlungssätze“ | Kostensätze der Wertermittlung |
| „WMS-Layer“ | externe Kartendienste, Modellname `wmssource` (die Quelle, nicht der einzelne Layer), siehe Abschnitt [Externe WMS-Quellen](./27-qgis-server-und-kartendienste.md#_27-4-externe-wms-quellen-als-hintergrund-einbinden) |
| „Leitungsauskünfte“, „Leitungsauskunftsbereiche“ | Auskünfte und Auskunftsbereiche |
| „Modell-Zugriffsrechte“, „Seiten-Zugriffsrechte“ | Modell- und Routenrechte, siehe Kapitel [Rollen und Rechte](./19-rollen-und-rechte.md) |

Die Oberfläche ist überwiegend deutsch. Einzelne Feldnamen, Hilfetexte und Beschriftungen stehen auf Englisch, weil sie nicht übersetzt sind, etwa „area type“ im Formular eines Gebiets, „Changes“ im Änderungsverlauf oder „Reset password“ im Formular eines Kontos; die Sprachauswahl in der Kopfzeile ändert daran nichts.

## 20.2 Suchen, Filtern und Massenbearbeitung

Jeder Bereich öffnet eine Liste. Ihre Bedienelemente:

- Suchfeld über der Liste – durchsucht je nach Bereich andere Spalten, bei den Rohren etwa den Namen. Nicht jede Liste hat eines.
- Filter rechts – grenzen die Liste auf einen Wert ein; mehrere Filter wirken zusammen.
- „Aktion“ über der Liste – führt eine Aktion für die angehakten Zeilen aus.

![Screenshot der Rohrliste im Administrationsbereich mit Beschriftung der Bereichsliste links, des Suchfelds oben, der Aktionsauswahl darunter, der Auswahlspalte links in der Tabelle und der Filter rechts](/images/manual/teil-b/admin_changelist.jpg)

Eine Aktion führen Sie so aus:

1. Haken Sie die Zeilen an, für die sie gelten soll. Der Haken in der Kopfzeile wählt alle Zeilen der Seite.
2. Wählen Sie die Aktion im Feld „Aktion“.
3. Klicken Sie auf „Ausführen“.

Neben „… löschen“ bieten einige Bereiche Aktionen, die Daten nachträglich in Ordnung bringen. Sie sind für die Fälle gedacht, in denen Daten an der Weboberfläche vorbei entstanden sind, etwa in QGIS oder durch einen Import:

| Bereich | Aktion | Wirkung |
|---|---|---|
| „Rohre“ | „Mikrorohre für ausgewählte Rohre erstellen (nur wenn keine vorhanden sind)“ | legt die Mikrorohre nach dem Rohrtyp an |
| „Kabel“ | „Fasern für ausgewählte Kabel erstellen (nur wenn keine vorhanden sind)“ | legt die Fasern nach dem Kabeltyp an |
| „Kabel“ | „Kabellänge für ausgewählte Kabel neu berechnen“ und „Kabellänge für alle Kabel mit aktuellen Filtern neu berechnen“ | berechnet die Kabellänge aus den verknüpften Mikrorohren neu |
| „Gräben“ | „Erstelle neue IDs für Trassen mit alten Formaten“ | vergibt Trassen-IDs im aktuellen Format |
| „Netzknoten“ | „Verknüpfe Kabel automatisch mit Mikrorohren (Adressbasiert)“ | verknüpft die Kabel an den gewählten Netzknoten mit den Mikrorohren ihrer Adressen |
| „Feature-Dateien“ | Verschieben und Löschen verwaister Dateien | siehe Abschnitt [Verwaiste Dateien](./23-dateien-und-anhaenge.md#_23-5-verwaiste-dateien-finden-verschieben-und-loschen) |
| „Log-Einträge“ | Löschen markierter oder aller gefilterten Einträge | siehe Kapitel [Betrieb der Instanz](./28-betrieb-der-instanz.md) |
| „WMS-Layer“ | „Empfohlene Einstellungen scannen und anwenden“ | siehe Abschnitt [Externe WMS-Quellen](./27-qgis-server-und-kartendienste.md#_27-4-externe-wms-quellen-als-hintergrund-einbinden) |

Die beiden Aktionen „… erstellen (nur wenn keine vorhanden sind)“ überspringen jedes Rohr und jedes Kabel, das schon Mikrorohre oder Fasern hat. Ein unvollständiger Satz wird nicht ergänzt.

::: warning
„Kabellänge für alle Kabel mit aktuellen Filtern neu berechnen“ wirkt auf die ganze gefilterte Liste, nicht nur auf die angehakten Zeilen und nicht nur auf die angezeigte Seite. Ohne Filter sind das alle Kabel der Installation. Dasselbe gilt für das Löschen aller gefilterten Log-Einträge.
:::

Einige Listen lassen Werte direkt in der Zeile ändern, etwa die Zugriffsebene der Modell-Zugriffsrechte oder die Reihenfolge der Container-Typen. Solche Änderungen speichern Sie mit „Sichern“ unter der Liste.

::: warning
Ohne „Sichern“ gehen in der Liste geänderte Werte beim Verlassen der Seite ohne Warnung verloren.
:::

## 20.3 Änderungsverlauf eines Objekts einsehen

Für die Fachobjekte – Trassen, Rohre, Mikrorohre, Kabel, Netzknoten, Adressen, Wohneinheiten, Gebiete – sowie für Projekte, Kennzeichen, Container-Typen, Auskünfte und Auskunftsbereiche speichert Qonnectra jede Änderung. Den Verlauf öffnen Sie im Formular des Objekts oben rechts mit „Geschichte“.

![Screenshot der Änderungsgeschichte eines Rohrs mit Hervorhebung der Liste der Versionen oben im Inhaltsbereich](/images/manual/teil-b/admin_history.jpg)

Die Liste nennt je Version den Zeitpunkt, die Art der Änderung („Kommentar“), das Konto („Geändert von“) und unter „Changes“ die geänderten Felder mit altem und neuem Wert. Ein Klick auf eine Version zeigt alle ihre Werte; von dort lässt sie sich wiederherstellen.

Auch Änderungen über die Weboberfläche stehen im Verlauf, mit dem Konto, das sie vorgenommen hat.

::: warning
Der Verlauf beginnt mit der ersten Änderung, die Qonnectra aufgezeichnet hat. Objekte, die aus einem Import stammen und seitdem nicht geändert wurden, zeigen „Dieses Objekt hat keine Änderungshistorie.“ Änderungen, die in QGIS direkt in der Datenbank vorgenommen werden, erscheinen nicht im Verlauf, siehe Kapitel [Netzdaten in QGIS bearbeiten](./26-netzdaten-in-qgis-bearbeiten.md).
:::

::: danger
Das Wiederherstellen überschreibt die aktuellen Werte des Objekts mit dem Stand der gewählten Version. Verbindungen zu anderen Objekten – die Mikrorohre eines Rohrs, die Rohrzuordnung, die Fasern eines Kabels – stellt es nicht wieder her. Ein gelöschtes Objekt kommt damit nicht samt seinem Umfeld zurück.
:::

## 20.4 Was im Administrationsbereich nicht gepflegt werden sollte

Der Administrationsbereich zeigt zu jedem Fachobjekt ein Formular mit allen Feldern. Dass ein Feld dort steht, heißt nicht, dass es dort gepflegt werden sollte:

- **Geometrien** – Trassen, Netzknoten, Adressen und Gebiete zeichnen Sie in QGIS, siehe Kapitel [Netzdaten in QGIS bearbeiten](./26-netzdaten-in-qgis-bearbeiten.md).
- **Fachdaten, die die Weboberfläche bearbeitet** – Rohre, Kabel, Wohneinheiten, Auskünfte. Die Weboberfläche prüft Eingaben, die das Formular hier nicht prüft, und legt abhängige Daten passend an.
- **IDs, UUIDs und berechnete Felder** wie Länge oder Trassen-ID. Qonnectra setzt sie selbst.

::: danger
Löschen nimmt abhängige Objekte mit, hier wie in der Weboberfläche. Ein gelöschtes Rohr etwa nimmt seine Mikrorohre, seine Rohrzuordnung und die Verknüpfungen zu Kabeln mit. Die Rückfrage der Weboberfläche nennt davon höchstens die Rohrzuordnung; die Bestätigungsseite hier listet alles auf, was mitgelöscht wird. Lesen Sie die Liste, bevor Sie bestätigen – rückgängig machen lässt sich das Löschen nur über eine Sicherung, siehe Kapitel [Betrieb der Instanz](./28-betrieb-der-instanz.md).
:::

![Screenshot der Bestätigungsseite beim Löschen eines Rohrs mit der Zusammenfassung der mitgelöschten Mikrorohre, Rohrzuordnungen und Verknüpfungen oben und der Liste der einzelnen Objekte darunter](/images/manual/teil-b/admin_delete_confirmation.jpg)

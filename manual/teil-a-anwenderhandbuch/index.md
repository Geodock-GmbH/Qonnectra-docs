# Teil A - Anwenderhandbuch

Dieser Teil des Handbuchs richtet sich an Anwenderinnen und Anwender, die Qonnectra im täglichen Betrieb nutzen. Dazu gehören insbesondere Mitarbeitende in Verwaltungen, Zweckverbänden, Stadtwerken sowie Entscheidungsträger und externe Stellen mit Leserechten.

In Teil A wird ausschließlich die Arbeit mit der **Webanwendung** beschrieben. Es sind **keine GIS-Kenntnisse erforderlich**. Alle hier dargestellten Funktionen können sicher über den Webbrowser genutzt werden.

Themen wie Systemadministration, QGIS-Nutzung oder technische Einrichtung sind nicht Bestandteil dieses Teils und werden in den folgenden Abschnitten behandelt.

## Ziele der Dokumentation

Die **Webanwendung** dient der strukturierten Einsicht, Dokumentation und Auswertung des Netzbestands. Sie ist bewusst reduziert gestaltet, um auch ohne GIS-Vorkenntnisse genutzt werden zu können, und bereitet Trassen, Verlegearten, Oberflächen, Netzebenen, Netzknoten und Gewährleistungsstände projektbezogen auf. Der Fokus liegt dabei auf drei Zielen:

- **Transparenz schaffen** über den dokumentierten Ausbauzustand,
- **Wissen sichern**, etwa für Rückfragen von Ämtern, beteiligten Organisationen oder Förderinstitutionen,
- **Komplexität reduzieren** durch eine klare, nicht überladene Benutzeroberfläche.

## Ansehen und Bearbeiten

Der größte Teil der Anwendung ist zur Ansicht bestimmt: Das Dashboard wertet den Bestand aus, die Karte zeigt die Objekte mit ihren Eigenschaften – geändert wird an beiden Stellen nichts. Anlegen und bearbeiten können Sie

- Rohre und ihre Eigenschaften in der **Rohrverwaltung**, siehe Kapitel [Rohrverwaltung](./10-rohrverwaltung.md),
- die Zuordnung von Rohren zu Trassensegmenten in der **Rohrzuordnung**, siehe Kapitel [Rohrzuordnung](./11-rohrzuordnung.md),
- Anhänge (Dateien) an Kartenobjekten und an Rohren, siehe Abschnitt [Anhänge hochladen, ansehen und löschen](./03-wiederkehrende-bedienelemente.md#_3-7-anhange-hochladen-ansehen-und-loschen).

Die **Geometrie** – der Verlauf einer Trasse, die Lage eines Netzknotens oder der Zuschnitt eines Gebiets – wird nicht in der Webanwendung bearbeitet, sondern in QGIS. Beide greifen auf dieselbe Datenbasis zu; das Vorgehen beschreibt Teil B des Handbuchs.

## Ein typischer Arbeitsablauf

Für den Einstieg hat sich die folgende Reihenfolge bewährt:

1. Melden Sie sich an und machen Sie sich mit dem Aufbau der Oberfläche vertraut, siehe Kapitel [Erste Schritte](./01-erste-schritte.md).
2. Wählen Sie oben links in der Kopfzeile das Projekt aus, mit dem Sie arbeiten möchten.
3. Verschaffen Sie sich im Dashboard einen Überblick über den Ausbauzustand, siehe Kapitel [Dashboard](./04-dashboard.md).
4. Sehen Sie sich einzelne Objekte in der Karte an und rufen Sie deren Eigenschaften und Anhänge ab, siehe Kapitel [Karte](./05-karte.md).
5. Pflegen Sie Rohre in der Rohrverwaltung und ordnen Sie sie anschließend den Trassensegmenten zu, siehe Kapitel [Rohrverwaltung](./10-rohrverwaltung.md) und [Rohrzuordnung](./11-rohrzuordnung.md).

Die Kapitel 4 bis 17 von Teil A folgen der linken Navigationsleiste von oben nach unten. Die Kapitel 1 bis 3 stehen davor, weil die übrigen darauf aufbauen.

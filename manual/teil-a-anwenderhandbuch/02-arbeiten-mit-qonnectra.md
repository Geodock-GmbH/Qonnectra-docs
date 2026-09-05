# 2. Arbeiten mit Qonnectra

Qonnectra ist kein Planungswerkzeug für neue Glasfasernetze. Es ist für die **Dokumentation** und **Verwaltung des passiven Netzbestands** ausgelegt, also für die Bestandteile eines Netzes, die keine aktive Technik wie Ports, Bandbreiten oder Betriebsdaten benötigen. Dieses Kapitel beschreibt, was das für die tägliche Arbeit bedeutet: worauf sich die angezeigten Daten beziehen und was Sie in der Webanwendung ändern können.

## 2.1 Ziele der Dokumentation

Die **Webanwendung** dient der strukturierten Einsicht, Dokumentation und Auswertung des Netzbestands. Sie ist bewusst reduziert gestaltet, um auch ohne GIS-Vorkenntnisse genutzt werden zu können, und bereitet Trassen, Verlegearten, Oberflächen, Netzebenen, Netzknoten und Gewährleistungsstände projektbezogen auf. Der Fokus liegt dabei auf drei Zielen:

- **Transparenz schaffen** über den dokumentierten Ausbauzustand,
- **Wissen sichern**, etwa für Rückfragen von Ämtern, beteiligten Organisationen oder Förderinstitutionen,
- **Komplexität reduzieren** durch eine klare, nicht überladene Benutzeroberfläche.

## 2.2 Das Projekt als Bezugsgröße

Alle Daten in Qonnectra gehören zu einem **Projekt**. Welches Projekt gilt, wählen Sie oben links in der Kopfzeile; die Auswahl gilt für die gesamte Anwendung und bleibt beim Wechsel in eine andere Ansicht erhalten. Kennzahlen, Karteninhalte und Listen zeigen deshalb immer nur den Bestand des ausgewählten Projekts, siehe Kapitel [Dashboard](./04-dashboard.md).

::: info
Nur in den Kartenansichten lässt sich diese Beschränkung über „Alle Projekte anzeigen“ vorübergehend aufheben. Welche Projekte in der Auswahl stehen, hängt von Ihrem Benutzerkonto ab.
:::

## 2.3 Ansehen und Bearbeiten

Der größte Teil der Anwendung ist zur Ansicht bestimmt: Das Dashboard wertet den Bestand aus, die Karte zeigt die Objekte mit ihren Eigenschaften – geändert wird an beiden Stellen nichts. Anlegen und bearbeiten können Sie

- Rohre und ihre Eigenschaften in der **Rohrverwaltung**, siehe Kapitel [Rohrverwaltung](./06-rohrverwaltung.md),
- die Zuordnung von Rohren zu Trassensegmenten in der **Rohrzuordnung**, siehe Kapitel [Rohrzuordnung](./07-rohrzuordnung.md),
- Anhänge (Dateien) an Kartenobjekten und an Rohren, siehe Abschnitt [Anhänge von Kartenobjekten](./05-karte.md#_5-3-1-anhange-von-kartenobjekten).

Die **Geometrie** – der Verlauf einer Trasse, die Lage eines Netzknotens oder der Zuschnitt eines Gebiets – wird nicht in der Webanwendung bearbeitet, sondern in QGIS. Beide greifen auf dieselbe Datenbasis zu; das Vorgehen beschreibt Teil B des Handbuchs.

::: warning
Welche Menüpunkte Sie sehen und was Sie darin ändern dürfen, hängt von den Rechten Ihres Benutzerkontos ab. Fehlt ein in diesem Handbuch genannter Bereich, ist er für Ihr Konto nicht freigegeben – wenden Sie sich in diesem Fall an Ihre Administration.
:::

## 2.4 Ein typischer Arbeitsablauf

Für den Einstieg hat sich die folgende Reihenfolge bewährt:

1. Melden Sie sich an und machen Sie sich mit dem Aufbau der Oberfläche vertraut, siehe Kapitel [Einstieg und Anmeldung](./03-einstieg-und-anmeldung.md).
2. Wählen Sie oben links in der Kopfzeile das Projekt aus, mit dem Sie arbeiten möchten.
3. Verschaffen Sie sich im Dashboard einen Überblick über den Ausbauzustand, siehe Kapitel [Dashboard](./04-dashboard.md).
4. Sehen Sie sich einzelne Objekte in der Karte an und rufen Sie deren Eigenschaften und Anhänge ab, siehe Kapitel [Karte](./05-karte.md).
5. Pflegen Sie Rohre in der Rohrverwaltung und ordnen Sie sie anschließend den Trassensegmenten zu, siehe Kapitel [Rohrverwaltung](./06-rohrverwaltung.md) und [Rohrzuordnung](./07-rohrzuordnung.md).

Die Kapitel von Teil A folgen dieser Reihenfolge.

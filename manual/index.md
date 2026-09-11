# Über dieses Handbuch

## Ziel des Handbuchs

Dieses Handbuch beschreibt die Nutzung, den Betrieb und die technische Grundlage von **Qonnectra**. Es richtet sich an alle Personen, die mit dem System arbeiten oder für dessen Betrieb, Pflege oder Weiterentwicklung verantwortlich sind.

Ziel des Handbuchs ist es,

- Anwender\*Innen einen sicheren und verständlichen Einstieg in die Arbeit mit Qonnectra zu ermöglichen,
- den täglichen Umgang mit der Anwendung zu unterstützen,
- Zuständigkeiten und Rollen klar zu machen,
- sowie technische Hintergründe für Betrieb und Entwicklung nachvollziehbar zu dokumentieren.

Das Handbuch ist bewusst praxisorientiert aufgebaut. Es folgt der Struktur der Anwendung und den typischen Arbeitsabläufen in Verwaltung, Betrieb und Fachplanung.


## Zielgruppen und Aufbau des Handbuchs

Qonnectra wird von Nutzenden mit sehr unterschiedlichen fachlichen Hintergründen verwendet. Entsprechend ist auch dieses Handbuch in mehrere Teile gegliedert, die sich an verschiedene Zielgruppen richten.

Das Handbuch besteht aus drei Hauptteilen:

- **Teil A – Anwenderhandbuch**  
  Dieser Teil richtet sich an Verwaltungsmitarbeitende, Sachbearbeitung, Personen mit Entscheidungsbefugnis sowie weitere Nutzende ohne vertiefte GIS-Kenntnisse. Er beschreibt die Arbeit mit der Webanwendung (Dashboard, Karte, Fachmodule) und ist für den täglichen Betrieb ausreichend.

- **Teil B – Betrieb, Administration und QGIS-Nutzung**  
  Dieser Teil richtet sich an Personen mit administrativen und fachlichen Aufgaben, z. B. für Benutzerverwaltung, Stammdatenpflege, Qualitätssicherung sowie die Nutzung von QGIS für geometrische Arbeiten und spezielle GIS-Aufgaben. Er beschreibt den sicheren Betrieb von Qonnectra sowie die verantwortungsvolle Nutzung von QGIS im Zusammenspiel mit der Webanwendung.

- **Teil C – Entwicklungs- und Systemdokumentation**  
  Dieser Teil richtet sich ausschließlich an fachlich-technische Rollen, darunter Personen in der Softwareentwicklung, im DevOps, in der GIS-Administration sowie in der Open-Source-Community. Er beschreibt Setup, Architektur, Schnittstellen, Datenmodelle und Erweiterungsmöglichkeiten von Qonnectra.


| Ebene | Zielgruppe | Werkzeuge/Technologien | Handbuch |
|-------|------------|------------------------|---------------|
| **1. Anwendungsebene** | Verwaltungsmitarbeitende, Sachbearbeitung | Webbrowser (Qonnectra Webanwendung)| **Teil A** |
| **2. Betrieb und Fachanwendung** | Administration, GIS-Fachkräfte | Qonnectra Webanwendung + QGIS | **Teil B** |
| **3. System- und Entwicklungsebene** | Entwicklung, DevOps, Systemadministration | Qonnectra Backend, Datenbank, API, Git usw. | **Teil C** |

Für den normalen Betrieb von Qonnectra ist es **nicht erforderlich**, alle Teile des Handbuchs zu lesen. Die Zielgruppe ist jeweils auf der Ebene des Teils festgelegt: Jeder der drei Teile beginnt mit einer Seite, die nennt, an wen er sich richtet und welche Vorkenntnisse er voraussetzt. Innerhalb eines Teils gilt diese Angabe für alle Kapitel.


## Konventionen in diesem Handbuch

Damit die Kapitel schnell zu lesen sind, gelten durchgehend dieselben Regeln:

- **Beschriftungen der Anwendung** stehen in Anführungszeichen und wortgleich so, wie die Oberfläche sie zeigt: „Speichern“, „+ Rohr hinzufügen“, Reiter „Anhänge“. Meldungen der Anwendung sind ebenso zitiert.
- **Fachbegriffe** stehen bei ihrer ersten Erklärung fett – **Rohrzuordnung**, **Transparenz**, **Kennzeichen**. Erklärt wird ein Begriff genau einmal; alle weiteren Stellen verweisen darauf.
- **Nummerierte Listen** sind Arbeitsschritte in genau dieser Reihenfolge. Aufzählungen mit Punkten nennen Möglichkeiten oder Eigenschaften.
- **Bilder** sitzen hinter dem Absatz, den sie zeigen. Ein Klick vergrößert sie – Einzelheiten, die in der Seite klein wirken, sind darin lesbar.
- **Querverweise** nennen das Ziel im Klartext („siehe Kapitel Karte“) und führen direkt dorthin.

Dazu kommen drei Arten von hervorgehobenen Kästen, die in dieser Reihenfolge dringlicher werden:

::: info
Wissenswertes zum Verständnis: wie ein Wert zustande kommt, was eine Meldung bedeutet, wo eine Angabe sonst noch auftaucht.
:::

::: warning
Grenzen und Fallstricke: eine Auswertung, die nur die zehn größten Werte zeigt, ein Feld, das leer aussieht, obwohl ein Wert gespeichert ist, eine Aktion, die ohne das nötige Recht scheitert.
:::

::: danger
Fälle, in denen Daten verloren gehen oder unbeabsichtigt geändert werden. Lesen Sie diese Kästen, bevor Sie die beschriebene Aktion ausführen.
:::

Eine Besonderheit betrifft die Anzeige am rechten Rand, in der die Eigenschaften eines ausgewählten Objekts stehen: Die Anwendung nennt sie „Seitenleiste“ – dasselbe Wort, das sie auch für die Navigationsleiste am linken Rand verwendet. Dieses Handbuch nennt die Anzeige am rechten Rand deshalb durchgehend **Info-Box** und behält „Navigationsleiste“ für die Leiste links.

## Was ist Qonnectra?

Qonnectra ist eine **Open-Source-Webanwendung zur nachhaltigen Dokumentation passiver Netzinfrastruktur**.  
Der Schwerpunkt liegt auf Glasfasernetzen, perspektivisch auch auf weiteren Netzinfrastrukturen.

Qonnectra bildet den **tatsächlichen Bestand (IST-Zustand)** eines Netzes ab und fungiert als digitaler Zwilling. Dokumentiert werden unter anderem:

- Trassen und Trassensegmente
- Rohre und Mikrorohre
- Netzknoten, Verteiler und Hausanschlüsse
- Kabel, Spleiße und zugehörige Sachdaten
- Fotos, Protokolle und weitere Dokumente

Ein zentrales Ziel von Qonnectra ist es, **Verwaltungen und verantwortliche Stellen für Netzinfrastruktur in die Lage zu versetzen**, ihre Netzinfrastruktur selbstständig, langfristig und datensouverän zu dokumentieren und zu betreiben – ohne Abhängigkeit von proprietärer Software oder spezialisierten Einzellösungen.


## Grundprinzip: Einfachheit und klare Trennung der Aufgaben

Qonnectra folgt einem klaren Prinzip:

- Die **Webanwendung** ist das führende Werkzeug für Übersicht, Auswertung und Dokumentation.
- **QGIS** wird ausschließlich als **spezialisiertes Fachwerkzeug** für Geometriearbeiten und spezielle GIS-Aufgaben eingesetzt.

Die Webanwendung wurde bewusst als Alternative zu einem QGIS-Plugin entwickelt. Dadurch können Arbeitsabläufe gezielt geführt werden, und Nutzende ohne GIS-Kenntnisse benötigen lediglich einen Webbrowser, um Informationen einzusehen und zu pflegen.

Für geschulte Nutzende können Webanwendung und QGIS parallel eingesetzt werden:

- QGIS für geometrische Änderungen und GIS-spezifische Arbeiten
- Qonnectra für Dokumentation, Auswertung und strukturierte Informationsanzeige

Alle Nutzenden arbeiten dabei auf derselben Datenbasis.


## Was ist Qonnectra nicht?

Für das Verständnis des Systems ist ebenso wichtig, klar zu benennen, **was Qonnectra bewusst nicht ist**:

- Qonnectra ist **kein Planungswerkzeug** für neue Netze.  
  Es dokumentiert ausschließlich den bestehenden, passiven Netzbestand.

- Qonnectra ist **keine Netzbetriebssoftware für aktive Technik**.  
  Aktive Komponenten wie Bandbreiten, Schaltungen oder die Ports von Vermittlungstechnik werden nicht verwaltet. Die Ports der passiven Komponenten eines Netzknotens – etwa die eines Splitters oder einer Spleißkassette – gehören dagegen zur Dokumentation.

- Qonnectra ist **kein Prognose- oder Szenariotool**.  
  Zukunftsplanungen oder hypothetische Ausbauzustände stehen nicht im Fokus.

Diese bewusste Abgrenzung trägt dazu bei, das System übersichtlich, wartbar und langfristig nutzbar zu halten.

## Dokumentation als langfristige Aufgabe

Qonnectra versteht Dokumentation nicht als einmalige Aufgabe, sondern als **kontinuierlichen Prozess**.  
Das System ist darauf ausgelegt,

- Daten langfristig verfügbar zu halten,
- offene Standards und Formate zu verwenden,
- und die Weitergabe von Informationen an Dritte (z. B. für Leitungsauskunft, Genehmigungen oder Berichte) zu erleichtern.

Die klare Trennung von Alltagstätigkeiten, administrativen Aufgaben und technischen Anpassungen ist ein zentrales Element dieses Konzepts und zieht sich durch das gesamte Handbuch.

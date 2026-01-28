# 1. Einführung und Einordnung

## 1.1 Ziel des Handbuchs

Dieses Handbuch beschreibt die Nutzung, den Betrieb und die technische Grundlage von **Qonnectra**. Es richtet sich an alle Personen, die mit dem System arbeiten oder für dessen Betrieb, Pflege oder Weiterentwicklung verantwortlich sind.

Ziel des Handbuchs ist es,

- Anwender*Innen einen sicheren und verständlichen Einstieg in die Arbeit mit Qonnectra zu ermöglichen,
- den täglichen Umgang mit der Anwendung zu unterstützen,
- Zuständigkeiten und Rollen klar zu machen,
- sowie technische Hintergründe für Betrieb und Entwicklung nachvollziehbar zu dokumentieren.

Das Handbuch ist bewusst praxisorientiert aufgebaut. Es folgt der Struktur der Anwendung und den typischen Arbeitsabläufen in Verwaltung, Betrieb und Fachplanung.


## 1.2 Zielgruppen und Aufbau des Handbuchs

Qonnectra wird von Nutzer*Innen mit sehr unterschiedlichen fachlichen Hintergründen verwendet. Entsprechend ist auch dieses Handbuch in mehrere Teile gegliedert, die sich an verschiedene Zielgruppen richten.

Das Handbuch besteht aus drei Hauptteilen:

- **Teil A – Anwenderhandbuch**  
  Dieser Teil richtet sich an Verwaltungsmitarbeitende, Sachbearbeitung, Entscheidungsträger sowie weitere Nutzende ohne vertiefte GIS-Kenntnisse. Er beschreibt die Arbeit mit der Webanwendung (Dashboard, Karte, Fachmodule) und ist für den täglichen Betrieb ausreichend.

- **Teil B – Betrieb, Administration und QGIS-Nutzung**  
  Dieser Teil richtet sich an Personen mit administrativen und fachlichen Aufgaben, z. B. für Benutzerverwaltung, Stammdatenpflege, Qualitätssicherung sowie die Nutzung von QGIS für geometrische Arbeiten und spezielle GIS-Aufgaben. Er beschreibt den sicheren Betrieb von Qonnectra sowie die verantwortungsvolle Nutzung von QGIS im Zusammenspiel mit der Webanwendung.

- **Teil C – Entwickler- und Systemdokumentation**  
  Dieser Teil richtet sich ausschließlich an technische Rollen wie Entwickler, DevOps, GIS-Administratoren und die Open-Source-Community. Er beschreibt Setup, Architektur, Schnittstellen, Datenmodelle und Erweiterungsmöglichkeiten von Qonnectra.


| Ebene | Zielgruppe | Werkzeuge/Technologien | Handbuch |
|-------|------------|------------------------|---------------|
| **1. Anwendungsebene** | Verwaltungsmitarbeitende, Sachbearbeitung | Webbrowser (Qonnectra Webanwendung)| **Teil A** |
| **2. Betrieb und Fachanwendung** | Administrator*Innen, GIS-Fachkräfte | Qonnectra Webanwendung + QGIS | **Teil B** |
| **3. System- und Entwicklungsebene** | Entwickler*Innen, DevOps, Systemadministration | Qonnectra Backend, Datenbank, API, Git usw. | **Teil C** |

Für den normalen Betrieb von Qonnectra ist **nicht erforderlich**, alle Teile des Handbuchs zu lesen. Jedes Kapitel ist so aufgebaut, dass klar erkennbar ist, für welche Zielgruppe es relevant ist.


## 1.3 Was ist Qonnectra?

Qonnectra ist eine **Open-Source-Webanwendung zur nachhaltigen Dokumentation passiver Netzinfrastruktur**.  
Der Schwerpunkt liegt auf Glasfasernetzen, perspektivisch auch auf weiteren Netzinfrastrukturen.

Qonnectra bildet den **tatsächlichen Bestand (IST-Zustand)** eines Netzes ab und fungiert als digitaler Zwilling. Dokumentiert werden unter anderem:

- Trassen und Trassensegmente
- Rohre und Mikrorohre
- Netzknoten, Verteiler und Hausanschlüsse
- Kabel, Spleiße und zugehörige Sachdaten
- Fotos, Protokolle und weitere Dokumente

Ein zentrales Ziel von Qonnectra ist es, **Verwaltungen und Netzeigentümer in die Lage zu versetzen**, ihre Netzinfrastruktur selbstständig, langfristig und datensouverän zu dokumentieren und zu betreiben – ohne Abhängigkeit von proprietärer Software oder spezialisierten Einzellösungen.


## 1.4 Grundprinzip: Einfachheit und klare Trennung der Aufgaben

Qonnectra folgt einem klaren Prinzip:

- Die **Webanwendung** ist das führende Werkzeug für Übersicht, Auswertung und Dokumentation.
- **QGIS** wird ausschließlich als **Expertenwerkzeug** für Geometriearbeiten und spezielle GIS-Aufgaben eingesetzt.

Die Webanwendung wurde bewusst als Alternative zu einem QGIS-Plugin entwickelt. Dadurch können Arbeitsabläufe gezielt geführt werden, und Nutzer ohne GIS-Kenntnisse benötigen lediglich einen Webbrowser, um Informationen einzusehen und zu pflegen.

Für geschulte Nutzer können Webanwendung und QGIS parallel eingesetzt werden:

- QGIS für geometrische Änderungen und GIS-spezifische Arbeiten
- Qonnectra für Dokumentation, Auswertung und strukturierte Informationsanzeige

Alle Nutzer arbeiten dabei auf derselben Datenbasis.


## 1.5 Was ist Qonnectra nicht?

Für das Verständnis des Systems ist ebenso wichtig, klar zu benennen, **was Qonnectra bewusst nicht ist**:

- Qonnectra ist **kein Planungswerkzeug** für neue Netze.  
  Es dokumentiert ausschließlich den bestehenden, passiven Netzbestand.

- Qonnectra ist **keine Netzbetriebssoftware für aktive Technik**.  
  Aktive Komponenten wie Ports, Bandbreiten oder aktive Schaltungen werden nicht verwaltet.

- Qonnectra ist **kein Prognose- oder Szenariotool**.  
  Zukunftsplanungen oder hypothetische Ausbauzustände stehen nicht im Fokus.

Diese bewusste Abgrenzung trägt dazu bei, das System übersichtlich, wartbar und langfristig nutzbar zu halten.

## 1.6 Dokumentation als langfristige Aufgabe

Qonnectra versteht Dokumentation nicht als einmalige Aufgabe, sondern als **kontinuierlichen Prozess**.  
Das System ist darauf ausgelegt,

- Daten langfristig verfügbar zu halten,
- offene Standards und Formate zu verwenden,
- und die Weitergabe von Informationen an Dritte (z. B. für Leitungsauskunft, Genehmigungen oder Berichte) zu erleichtern.

Die klare Trennung von Alltagstätigkeiten, administrativen Aufgaben und Experteneingriffen ist ein zentrales Element dieses Konzepts und zieht sich durch das gesamte Handbuch.

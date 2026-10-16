# 21. Projekte und Stammdaten pflegen

Projekte und Stammdaten legen Sie im Administrationsbereich an, siehe Kapitel [Der Administrationsbereich](./20-administrationsbereich.md). Die Weboberfläche liest sie nur: Ein Projekt, das hier fehlt, erscheint nicht in der Projektauswahl, ein Status, der hier fehlt, steht in keiner Auswahlliste. Was die einzelnen Listen für die Nutzenden bedeuten, beschreibt Abschnitt [Stammdaten](../teil-a-anwenderhandbuch/02-grundbegriffe-und-datenmodell.md#_2-7-stammdaten-status-phase-netzebene-firmen).

![Screenshot des Formulars eines Projekts im Administrationsbereich mit Name, Beschreibung und dem Schalter „Aktiv“ oben und den Projekteinstellungen darunter](/images/manual/teil-b/admin_project_form.jpg)

Für alle Listen dieses Kapitels gilt:

- Stammdaten gelten für die ganze Installation, nicht je Projekt. Ein neuer Wert steht sofort in allen Projekten zur Auswahl.
- Eine Umbenennung wirkt überall, wo der Wert verwendet wird. Ausnahmen sind die Farben, siehe Abschnitt [Rohrtypen und Mikrorohrfarben](#_21-4-rohrtypen-und-mikrorohrfarben).
- Was beim Löschen eines Werts geschieht, der noch verwendet wird, hängt von der Liste ab:
  - **Löschen samt Verwendung** – „Rohrtypen“, „Kabeltypen“, „Komponententypen“, „Oberflächen“, „Bau-/Verlegearten“ und „Phasen“. Alle Objekte mit diesem Wert werden mitgelöscht, siehe unten.
  - **Löschen verweigert** – „Mikrorohrfarben“ und „Faserfarben“, die ein Rohr- oder Kabeltyp verwendet, sowie „Faserstatus“, „Container-Typen“, „Wohnungseinheit-Typen“ und „Wohnungseinheit-Status“. Die Bestätigungsseite nennt die Objekte, die den Wert verwenden, und bietet keine Schaltfläche zum Bestätigen an.
  - **Fehler erst beim Löschen** – „Netzebenen“, „Netzknotentypen“, „Gebietstypen“ und „Ausbaustatus“. Die Bestätigungsseite warnt nicht; erst das Löschen selbst scheitert mit einer Fehlerseite, und es wird nichts gelöscht.
  - **Mischfälle** – „Status“, „Firmen“, „Kennzeichen“ und „Projekte“. Trassen mit diesem Wert werden mitgelöscht. Verwenden ihn auch Rohre, Netzknoten oder Kabel, scheitert das Löschen dagegen mit einer Fehlerseite, und es wird nichts gelöscht – auch keine Trasse. Verwenden Fasern das Kennzeichen oder das Projekt, verweigert schon die Bestätigungsseite das Löschen. Ein Projekt nimmt außerdem seine Einstellungen, Kostensätze, externen Kartendienste und Leitungsauskünfte mit.
  - **Wert wird entfernt** – „Mikrorohrstatus“, „Art der Arbeiten“ und „Anfragegründe“. Die Objekte bleiben erhalten und verlieren nur diese Angabe.

Benennen Sie einen verwendeten Wert um, statt ihn zu löschen; wo es das Feld „Aktiv“ gibt, setzen Sie ihn auf inaktiv.

::: danger
Ein gelöschter Rohrtyp nimmt alle Rohre dieses Typs mit, samt ihren Mikrorohren, ihrer Rohrzuordnung und den Verknüpfungen zu Kabeln. Ein gelöschter Kabeltyp nimmt alle Kabel dieses Typs mit, samt ihren Fasern und Spleißen, ein gelöschter Komponententyp alle eingebauten Komponenten mit ihren Spleißen. Eine gelöschte Oberfläche, Bauart oder Phase löscht alle Trassen, die sie verwenden, und mit ihnen deren Rohrzuordnung. Eine Fehlermeldung gibt es dabei nicht. Die Bestätigungsseite listet auf, was mitgelöscht wird – lesen Sie sie, bevor Sie bestätigen.
:::

## 21.1 Projekte anlegen und Vorbelegungen setzen

Projekte stehen unter „Api“ → „Projekte“. Ein Projekt hat einen Namen („Projekt“), eine „Beschreibung“ und den Schalter „Aktiv“. Nur aktive Projekte erscheinen in der Projektauswahl der Weboberfläche; ein inaktives Projekt behält seine Daten.

Unter den drei Feldern stehen die Einstellungen des Projekts: „Netzwerkschema“, „Rohrverzweigung“ und „Wertermittlungssätze“. Füllen Sie sie gleich beim Anlegen; was sie bewirken, beschreibt Kapitel [Projektbezogene Konfiguration](./22-projektbezogene-konfiguration.md).

Ohne Kostensätze lässt sich die Wertermittlung nicht benutzen. Ohne Netzschema- und Rohrabzweig-Einstellungen bieten Netzschema und Rohrverzweigung jeden Netzknoten des Projekts an.

Ein frisch eingerichtetes Qonnectra bringt das Projekt „Default“ und das Kennzeichen „Default“ mit, außerdem eine Grundausstattung an Stammdaten: Status, Oberflächen, Netzebenen, Netzknotentypen, Rohr- und Kabeltypen mit ihren Farben sowie je einen Eintrag für „Art der Arbeiten“ und „Anfragegründe“. Passen Sie diese Listen an, bevor die ersten Daten erfasst werden.

## 21.2 Kennzeichen

Kennzeichen stehen unter „Api“ → „Kennzeichen“. Ein Kennzeichen hat nur einen Namen. Was es in der Weboberfläche bewirkt, beschreibt Abschnitt [Kennzeichen als projektweiter Filter](../teil-a-anwenderhandbuch/02-grundbegriffe-und-datenmodell.md#_2-6-kennzeichen-als-projektweiter-filter).

::: info
Kennzeichen gehören keinem Projekt. Jedes Kennzeichen steht in allen Projekten zur Auswahl, auch wenn es nur in einem verwendet wird. Ein Name, aus dem das Projekt hervorgeht, hilft bei der Auswahl.
:::

## 21.3 Status, Phase, Netzebene, Oberfläche, Bauart

Diese Listen bestehen aus einem einzigen Feld, dem Namen des Werts. Sie stehen unter „Status“, „Phasen“, „Netzebenen“, „Oberflächen“ und „Bau-/Verlegearten“.

Die „Oberflächen“ haben zusätzlich das Feld „Versiegelung“, das festhält, ob die Oberfläche versiegelt ist. Es dient der Dokumentation; keine Auswertung rechnet damit, auch nicht die Wertermittlung, siehe Abschnitt [Woher die Kostensätze kommen](../teil-a-anwenderhandbuch/09-wertermittlung.md#_9-3-woher-die-kostensatze-kommen).

![Screenshot der Liste der Oberflächen mit Hervorhebung der Spalte „Versiegelung“ rechts](/images/manual/teil-b/admin_surface.jpg)

Nach demselben Muster gepflegt werden „Mikrorohrstatus“, „Faserstatus“ und „Ausbaustatus“ (für Adressen).

## 21.4 Rohrtypen und Mikrorohrfarben

Ein **Rohrtyp** legt fest, welche Mikrorohre ein Rohr bekommt. Rohrtypen stehen unter „Rohrtypen“, ihre Felder:

- „Rohrtyp“ – der Name, etwa „12x10/6“.
- „Rohrzahl“ – die Zahl der Mikrorohre, zur Information.
- „Hersteller“ – eine Firma aus der Liste der Firmen.
- Unter „Rohrtyp-Farbzuordnungen“ eine Zeile je Mikrorohr: „Position“ und „Farbe“.

![Screenshot des Formulars für einen Rohrtyp mit Hervorhebung der Farbzuordnungen](/images/manual/teil-b/admin_conduit_type.jpg)

Die Mikrorohre eines neuen Rohrs entstehen aus den Farbzuordnungen, nicht aus der „Rohrzahl“: eines je Zeile, mit deren Position als Nummer und deren Farbe.

::: warning
Ein Rohrtyp ohne Farbzuordnungen erzeugt Rohre ohne Mikrorohre, ohne jede Meldung. Legen Sie die Zuordnungen an, bevor jemand den Typ verwendet. Rohre, die schon ohne Mikrorohre entstanden sind, ergänzt die Aktion „Mikrorohre für ausgewählte Rohre erstellen (nur wenn keine vorhanden sind)“, siehe Abschnitt [Suchen, Filtern und Massenbearbeitung](./20-administrationsbereich.md#_20-2-suchen-filtern-und-massenbearbeitung).
:::

Die Zuordnungen wirken nur beim Anlegen eines Rohrs. Ändern Sie sie später, behalten bestehende Rohre ihre Mikrorohre, siehe Abschnitt [Trasse, Rohr und Mikrorohr](../teil-a-anwenderhandbuch/02-grundbegriffe-und-datenmodell.md#_2-1-trasse-rohr-und-mikrorohr).

Die Farben selbst stehen unter „Mikrorohrfarben“. Jede Farbe hat die Felder „Deutscher Name“, „Englischer Name“, „Farbcode“ und, für zweifarbige Mikrorohre, „Sekundärer CSS-Farbcode“. „Anzeigereihenfolge“ und „Aktiv“ steuern die Auswahllisten.

![Screenshot der Liste der Mikrorohrfarben mit Namen, Farbcodes und Anzeigereihenfolge in der Mitte](/images/manual/teil-b/admin_microduct_colors.jpg)

::: warning
Benennen Sie eine Farbe nicht um, die schon verwendet wird. Ein Mikrorohr speichert seine Farbe als Namen, nicht als Verweis. Nach der Umbenennung findet Qonnectra zu den bestehenden Mikrorohren keine Farbe mehr und zeichnet sie grau. Legen Sie stattdessen eine neue Farbe an und setzen Sie die alte auf inaktiv.
:::

## 21.5 Kabeltypen, Faser- und Bündelfarben

Ein **Kabeltyp** legt fest, welche Fasern ein Kabel bekommt. Kabeltypen stehen unter „Kabeltypen“, ihre Felder:

- „Kabeltyp“ – der Name.
- „Faserzahl“ – die Zahl der Fasern, zur Information.
- „Rohrzahl“ – trotz der Beschriftung die Zahl der **Bündel**.
- „Faserzahl im Bündel“ – die Zahl der Fasern je Bündel.
- „Hersteller“ – eine Firma aus der Liste der Firmen.
- Unter „Faser-Farbzuordnungen“ je eine Zeile für jedes Bündel und für jede Faserposition im Bündel: „Positionstyp“ („Bündel“ oder „Faser“), „Position“, „Farbe“ und „Layer“ („Innen“ oder „Außen“).

![Screenshot des Formulars für einen Kabeltyp mit Hervorhebung der Felder für Bündel und Fasern und der Farbzuordnungen](/images/manual/teil-b/admin_cable_type.jpg)

Die Fasern eines neuen Kabels entstehen aus den Zuordnungen: für jedes Bündel so viele Fasern, wie „Faserzahl im Bündel“ angibt, mit der Bündelfarbe und der Farbe der Faserposition.

::: warning
Fasern entstehen nur, wenn es mindestens so viele Bündel-Zeilen gibt, wie „Rohrzahl“ angibt, und mindestens so viele Faser-Zeilen, wie „Faserzahl im Bündel“ angibt. Fehlt auch nur eine, bleibt das neue Kabel ohne Fasern, ohne Meldung. Die Aktion „Fasern für ausgewählte Kabel erstellen (nur wenn keine vorhanden sind)“ ergänzt sie, sobald die Zuordnungen vollständig sind, siehe Abschnitt [Suchen, Filtern und Massenbearbeitung](./20-administrationsbereich.md#_20-2-suchen-filtern-und-massenbearbeitung).
:::

Die Farben stehen unter „Faserfarben“ und werden wie die Mikrorohrfarben gepflegt; auch hier gilt die Warnung zur Umbenennung, siehe Abschnitt [Rohrtypen und Mikrorohrfarben](#_21-4-rohrtypen-und-mikrorohrfarben).

## 21.6 Netzknotentypen, Komponententypen und Portdefinitionen

**Netzknotentypen** stehen unter „Netzknotentypen“. Neben dem Namen haben sie die Felder „Dimension“, „Gruppe“ – ein Kürzel wie „HA“ oder „NVT“ – und „Firma“. Welche Netzknotentypen das Netzschema zeigt und welche als Rohrabzweig gelten, legen Sie je Projekt fest, siehe Kapitel [Projektbezogene Konfiguration](./22-projektbezogene-konfiguration.md).

**Komponententypen** sind die Bauteile, die in die Slots eines Netzknotens eingesetzt werden, etwa eine Spleißkassette oder ein Splitter, siehe Abschnitt [Netzknoten, Container, Slots, Komponenten und Ports](../teil-a-anwenderhandbuch/02-grundbegriffe-und-datenmodell.md#_2-3-netzknoten-container-slots-komponenten-und-ports). Sie stehen unter „Komponententypen“. „Belegte Steckplätze“ gibt an, wie viele Slots die Komponente einnimmt.

Die Ports eines Komponententyps stehen unter „Komponentenstrukturen“, eine Zeile je Port mit „In oder Out“, Portnummer und einem optionalen Alias. Ein Komponententyp ohne Ports lässt sich einsetzen, hat aber nichts, woran eine Faser anschließen kann.

Statt jeden Port einzeln anzulegen, nutzen Sie „Ports in Bulk erstellen“ oben rechts:

![Screenshot der Komponentenstrukturen mit Hervorhebung des Filters nach Komponententyp rechts und der Schaltfläche „Ports in Bulk erstellen“ oben rechts](/images/manual/teil-b/admin_component_structures.jpg)

1. Wählen Sie den „Komponententyp“.
2. Geben Sie die „Anzahl der Ports“ ein. Für jede Nummer entstehen ein Eingang und ein Ausgang; 12 ergibt 24 Einträge.
3. Lassen Sie die „Startposition“ auf 1, oder setzen Sie sie hinter die letzte vorhandene Nummer, um Ports zu ergänzen.
4. Klicken Sie auf „Ports erstellen“.

![Screenshot des Formulars „Ports in Bulk erstellen“ mit Komponententyp, Anzahl und Startposition oben im Inhaltsbereich](/images/manual/teil-b/admin_bulk_ports.jpg)

::: warning
Das Formular prüft nicht, ob es die Portnummern schon gibt. Ein zweiter Durchlauf mit derselben Startposition legt jeden Port doppelt an. Prüfen Sie vorher in der gefilterten Liste, bis zu welcher Nummer die Ports reichen.
:::

## 21.7 Container-Typen

**Container-Typen** sind die Kategorien, mit denen sich Slot-Konfigurationen eines Netzknotens gruppieren lassen, etwa „Rack“ oder „Schrank“. Sie stehen unter „Container-Typen“. Eine neue Installation bringt keine mit; solange es keinen aktiven gibt, fehlt in der Weboberfläche die Schaltfläche „Container hinzufügen“, siehe Kapitel [Netzschema](../teil-a-anwenderhandbuch/14-netzschema.md).

In der Liste lassen sich „Anzeigereihenfolge“ und „Aktiv“ direkt ändern; speichern Sie mit „Sichern“ unter der Liste. Ein inaktiver Container-Typ verschwindet aus der Auswahl, bestehende Container behalten ihn.

![Screenshot der Liste der Container-Typen mit Hervorhebung der direkt änderbaren Spalten „Anzeigereihenfolge“ und „Aktiv“](/images/manual/teil-b/admin_container_types.jpg)

Im Formular eines Container-Typs stehen „Icon“, „Farbe“, „Anzeigereihenfolge“ und „Aktiv“ unter der Überschrift „Rohrverzweigung“. Die Überschrift ist ein Übersetzungsfehler; die Felder betreffen nur die Anzeige des Containers.

## 21.8 Firmen als Eigentümer, Baufirma und Hersteller

Firmen stehen unter „Firmen“. Dieselbe Liste speist die Felder „Eigentümer“, „Baufirma“ und „Hersteller“ der Fachobjekte und den „Hersteller“ der Rohr-, Kabel- und Komponententypen. Neben dem Namen („Firma“) hat eine Firma eine Anschrift, „Telefon“ und „E-Mail“.

![Screenshot des Formulars „Firma hinzufügen“ mit Name, Stadt, Postleitzahl und Straße oben im Inhaltsbereich](/images/manual/teil-b/admin_company_form.jpg)

::: info
Die Weboberfläche zeigt von einer Firma nur den Namen. Anschrift, „Telefon“ und „E-Mail“ gibt Qonnectra über seine Schnittstelle aber an jedes angemeldete Konto heraus, siehe Kapitel [REST-API](../teil-c-entwicklungs-systemdokumentation/32-rest-api.md). Tragen Sie dort nur Kontaktdaten ein, die alle Nutzenden sehen dürfen – eine allgemeine Rufnummer statt der Durchwahl einer Person.
:::

## 21.9 Gebietstypen

Gebietstypen stehen unter „Gebietstypen“ und haben nur einen Namen, etwa „Projektgebiet“ oder „NVt-Gebiet“. Die Gebiete selbst zeichnen Sie in QGIS, siehe Kapitel [Netzdaten in QGIS bearbeiten](./26-netzdaten-in-qgis-bearbeiten.md). Wie ein Gebietstyp in der Karte aussieht, stellen die Nutzenden selbst ein, siehe Kapitel [Einstellungen](../teil-a-anwenderhandbuch/17-einstellungen.md).

## 21.10 Adress- und Wohneinheitentypen

Für Wohneinheiten gibt es zwei Listen, beide nur mit einem Namen: „Wohnungseinheit-Typen“, etwa Wohnung oder Gewerbe, und „Wohnungseinheit-Status“. Den Ausbaustatus einer Adresse pflegen Sie unter „Ausbaustatus“, siehe Abschnitt [Status, Phase, Netzebene, Oberfläche, Bauart](#_21-3-status-phase-netzebene-oberflache-bauart). Einen eigenen Typ für Adressen gibt es nicht.

## 21.11 Nachschlagelisten der Leitungsauskunft: Art der Arbeit, Grund der Anfrage

Die Auswahllisten „Art der Arbeit“ und „Grund der Anfrage“ der Leitungsauskunft stehen unter „Art der Arbeiten“ und „Anfragegründe“, jeweils nur mit einem Namen. Mitgeliefert ist je ein Eintrag, „Straßenbau“ und „Baumaßnahme“. Beide Listen gelten für alle Projekte, siehe Kapitel [Leitungsauskunft](../teil-a-anwenderhandbuch/08-leitungsauskunft.md).

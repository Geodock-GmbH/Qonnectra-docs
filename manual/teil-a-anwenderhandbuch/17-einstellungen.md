# 17. Einstellungen

Die **Einstellungen** sammeln, was Sie persönlich an Qonnectra einstellen können: die Angaben zu Ihrem Konto, die Breite der Navigationsleiste, die Farben und Formen der Kartenobjekte, die Farbe der Kabel im Netzschema und die Toleranz des Routings in der Rohrzuordnung. Sie erreichen sie über die linke Navigationsleiste im Fußbereich „System“ durch Klicken auf den Menüpunkt „Einstellungen“.

![Screenshot der Einstellungen mit den Abschnitten „Benutzer“, „UI“ und dem Beginn des Abschnitts „Karte“](/images/manual/teil-a/settings.jpg)

Alles auf dieser Seite wirkt sofort und nur für Sie: Jede Änderung greift mit dem Klick, ohne dass Sie sie bestätigen müssten, und niemand sonst bekommt Ihre Farben zu sehen. Umgekehrt ändert nichts davon die Daten – nur, wie sie dargestellt werden. Die Schaltflächen unter „Einstellungen synchronisieren“ übernehmen ebenfalls nichts, was noch offen wäre; sie übertragen den erreichten Stand in Ihr Konto, siehe Abschnitt [Einstellungen im Konto speichern und wieder laden](#_17-2-einstellungen-im-konto-speichern-und-wieder-laden).

::: warning
Die Einstellungen liegen zunächst im Browser, mit dem Sie sie vorgenommen haben. An einem anderen Rechner, in einem anderen Browser oder nach dem Löschen der Browserdaten sind sie wieder auf den Ausgangswerten. Damit sie Ihnen folgen, speichern Sie sie in Ihrem Konto, siehe Abschnitt [Einstellungen im Konto speichern und wieder laden](#_17-2-einstellungen-im-konto-speichern-und-wieder-laden).
:::

## 17.1 Benutzerkonto

Der Abschnitt „Benutzer“ nennt den „Benutzernamen“ und die „E-Mail“ des angemeldeten Kontos. Beide Angaben lassen sich hier nur ablesen. Stimmt etwas davon nicht, ändert das Ihre Administration im Administrationsbereich, siehe Kapitel [Der Administrationsbereich](../teil-b-betrieb-admin-qgis/20-administrationsbereich.md).

Ein Feld zum Ändern des Passworts gibt es nicht; auch das übernimmt die Administration, siehe Abschnitt [Passwort vergessen?](./01-erste-schritte.md#_1-1-2-passwort-vergessen).

## 17.2 Einstellungen im Konto speichern und wieder laden

Unter „Einstellungen synchronisieren“ stehen zwei Schaltflächen: „In Konto speichern“ legt Ihre aktuellen Einstellungen in Ihrem Benutzerkonto ab, „Aus Konto laden“ holt sie von dort in den gerade benutzten Browser und lädt die Seite anschließend neu.

![Screenshot der Einstellungen mit Hervorhebung des Bereichs „Einstellungen synchronisieren“ mit den Schaltflächen „In Konto speichern“ und „Aus Konto laden“](/images/manual/teil-a/settings_sync.jpg)

Gespeichert wird dabei mehr als diese Seite: Qonnectra nimmt alle persönlichen Voreinstellungen mit, die es im Browser ablegt. Dazu gehören

- die Navigationsleiste mit ihren zugeklappten Gruppen und ausgeblendeten Einträgen, siehe Abschnitt [Navigationsleiste anpassen](./01-erste-schritte.md#_1-5-navigationsleiste-anpassen),
- der Hell- und Dunkelmodus samt der Darstellung der Hintergrundkarte, siehe Abschnitt [Sprache, Hell- und Dunkelmodus](./01-erste-schritte.md#_1-4-sprache-hell-und-dunkelmodus-versionsanzeige-und-dokumentation),
- alle Farben und Formen aus den Abschnitten [Kartendarstellung](#_17-4-kartendarstellung-trassenfarbe-trassen-darstellung-highlight-farbe) und [Stile](#_17-5-stile-fur-netzknotentypen-adressen-und-gebietstypen),
- die Legende der Karte: ein- und ausgeblendete Layer, Beschriftungen und die Transparenz der Hintergrundkarte, siehe Abschnitt [Das Kartenfenster](./03-wiederkehrende-bedienelemente.md#_3-3-das-kartenfenster),
- die Breite der Info-Box, siehe Abschnitt [Die Info-Box](./03-wiederkehrende-bedienelemente.md#_3-6-die-info-box-mit-ihren-reitern),
- das gewählte Kennzeichen als projektweiter Filter, siehe Abschnitt [Kennzeichen](./02-grundbegriffe-und-datenmodell.md#_2-6-kennzeichen-als-projektweiter-filter),
- die Schaltfläche „Alle Projekte anzeigen“ der Karte,
- der Routing-Modus und die Anzeigeoptionen der Rohrzuordnung, siehe Kapitel [Rohrzuordnung](./11-rohrzuordnung.md),
- die Anzeigeoptionen des Netzschemas, darunter „Einrasten“ und die Kabelfarbe, siehe Abschnitt [Anzeigeoptionen](./14-netzschema.md#_14-10-anzeigeoptionen-einrasten-kabelrichtungs-animation).

::: warning
Beides sind einmalige Vorgänge, keine laufende Synchronisierung: Qonnectra gleicht nichts von selbst ab. Was Sie nach dem Speichern noch ändern, bleibt in diesem Browser, bis Sie erneut auf „In Konto speichern“ klicken – und ein anderer Rechner sieht Ihre Änderungen erst, wenn Sie dort „Aus Konto laden“ klicken.
:::

::: info
Nicht mitgenommen werden die Sprache der Oberfläche, der zuletzt betrachtete Kartenausschnitt und das ausgewählte Projekt. Sprache und Projekt stellen Sie in der Kopfzeile jedes Mal neu ein, siehe Abschnitt [Aufbau der Oberfläche](./01-erste-schritte.md#_1-2-aufbau-der-oberflache).
:::

::: warning
Es gibt genau einen Speicherstand je Konto, und „In Konto speichern“ überschreibt ihn ohne Rückfrage. Wer an zwei Rechnern arbeitet, sollte deshalb immer in derselben Richtung arbeiten: an dem einen speichern, an dem anderen laden. Speichern Sie von beiden aus, gewinnt der zuletzt gespeicherte Stand.
:::

::: warning
„Aus Konto laden“ überschreibt umgekehrt die Einstellungen des Browsers, in dem Sie es klicken. Ein Hinweis erscheint vorher nicht; die Seite lädt sich sofort danach neu.
:::

## 17.3 Oberfläche: Seitenleiste und Theme

Der Abschnitt „UI“ enthält einen einzigen Schalter, „Sidebar“. Er bestimmt, wie breit die Navigationsleiste am linken Rand ist: **„Erweitert“** – die Voreinstellung – zeigt sie mit Gruppennamen und Beschriftungen, **„Eingeklappt“** verkleinert sie auf eine schmale Leiste mit den Symbolen allein. Der Menüpunkt, auf dem Sie gerade stehen, bleibt auch dann hervorgehoben; die Beschriftung erscheint beim Zeigen mit der Maus.

![Screenshot der Einstellungen mit eingeklappter Navigationsleiste und Hervorhebung des Schalters „Sidebar“](/images/manual/teil-a/settings_sidebar.jpg)

::: info
Diesen Schalter gibt es nur hier. In der Navigationsleiste selbst können Sie Gruppen zuklappen und einzelne Einträge ausblenden, sie aber nicht auf Symbole verkleinern, siehe Abschnitt [Navigationsleiste anpassen](./01-erste-schritte.md#_1-5-navigationsleiste-anpassen).
:::

Die Umschaltung zwischen Hell- und Dunkelmodus steht nicht in den Einstellungen, sondern als Symbol in der Kopfzeile, siehe Abschnitt [Sprache, Hell- und Dunkelmodus, Versionsanzeige und Dokumentation](./01-erste-schritte.md#_1-4-sprache-hell-und-dunkelmodus-versionsanzeige-und-dokumentation). Zu den Angaben, die in Ihr Konto übertragen werden, gehört sie trotzdem.

## 17.4 Kartendarstellung: Trassenfarbe, Trassen-Darstellung, Highlight-Farbe

Der Abschnitt „Karte“ beginnt mit drei Einstellungen, die für alle Kartenfenster gelten – auch für die verkleinerten in der Nachverdichtung und in den Adressdetails.

**„Featurefarbe Highlight“** ist die Farbe, in der ein angeklicktes Objekt in der Karte erscheint. Voreingestellt ist Gelb.

**„Trassenfarbe“** ist die Farbe aller Trassenlinien, voreingestellt Blau.

**„Trassen-Darstellung“** entscheidet, ob es bei dieser einen Farbe bleibt:

- **„Einzelne Farbe“** – alle Trassen in der Farbe aus „Trassenfarbe“. Die Voreinstellung.
- **„Nach Oberfläche“** – je Oberfläche eine eigene Farbe.
- **„Nach Bauart“** – je Bauart eine eigene Farbe.

Bei den beiden letzten erscheint darunter ein weiterer Abschnitt, „Oberflächen-Stile“ bzw. „Bauart-Stile“, mit einer Kachel je Wert aus den Stammdaten. Alle beginnen bei der Trassenfarbe; ordnen Sie den Werten dort unterschiedliche Farben zu.

![Screenshot der Einstellungen mit der Trassen-Darstellung „Nach Oberfläche“ und den darunter erschienenen „Oberflächen-Stilen“](/images/manual/teil-a/settings_trench_style.jpg)

::: info
Dieselbe Umstellung entscheidet auch darüber, ob sich der Eintrag „Trasse“ in der Legende der Karte aufklappen lässt. Erst „Nach Oberfläche“ oder „Nach Bauart“ macht die einzelnen Oberflächen und Bauarten dort getrennt schaltbar, siehe Abschnitt [Das Kartenfenster](./03-wiederkehrende-bedienelemente.md#_3-3-das-kartenfenster).
:::

Ein Klick auf das Farbfeld öffnet die Farbauswahl Ihres Betriebssystems. „Zurücksetzen“ rechts neben „Featurefarbe Highlight“ und „Trassenfarbe“ stellt den Ausgangswert wieder her.

## 17.5 Stile für Netzknotentypen, Adressen und Gebietstypen

Die drei folgenden Abschnitte arbeiten gleich: Jeder zeigt eine Kachel je Eintrag mit einer Vorschau und darunter den einstellbaren Werten.

**„Netzknotentyp-Stile“** – je Netzknotentyp „Farbe“, „Größe“ (3 bis 30) und „Form“ („Quadrat“ oder „Kreis“).

![Screenshot der Einstellungen mit dem Abschnitt „Netzknotentyp-Stile“ und den Kacheln der einzelnen Netzknotentypen](/images/manual/teil-a/settings_node_types.jpg)

**„Adressen-Stil“** – eine einzige Kachel, „Adressenpunkte“, mit „Farbe“ und „Größe“ für alle Adressen zusammen.

**„Gebietstyp-Stile“** – je Gebietstyp nur die „Farbe“; Gebiete sind Flächen und haben keine Größe.

Über jedem der drei Abschnitte stehen zwei Schaltflächen: **„Zufällig“** würfelt für alle Kacheln des Abschnitts neue Werte aus – die Farbe und, wo es sie gibt, auch die Größe. Das hilft, Typen auseinanderzuhalten, die in der Karte derzeit gleich aussehen. **„Alle zurücksetzen“** stellt die Ausgangswerte wieder her. Beim Adressen-Stil heißt die zweite Schaltfläche „Zurücksetzen“, weil es dort nur eine Kachel gibt.

::: warning
Jede Kachel lässt sich auch einzeln zurücksetzen. Die Schaltfläche dafür sitzt oben rechts in der Kachel, ist aber unsichtbar, solange Sie nicht mit der Maus auf die Kachel zeigen – erst dann blendet sie sich ein. Sie heißt „Zurücksetzen“, mit einer Ausnahme: In den „Oberflächen-Stilen“ steht dort unübersetzt „Reset“. Diesen Abschnitt sehen Sie nur, wenn die „Trassen-Darstellung“ auf „Nach Oberfläche“ steht, siehe Abschnitt [Kartendarstellung](#_17-4-kartendarstellung-trassenfarbe-trassen-darstellung-highlight-farbe).
:::

![](/videos/settings_style_reset.webm)

::: info
Neue Netzknotentypen und Gebietstypen, die Ihre Administration anlegt, erscheinen hier von selbst und bringen eine Standardfarbe mit. Die Werte kommen aus den Stammdaten, siehe Abschnitt [Stammdaten](./02-grundbegriffe-und-datenmodell.md#_2-7-stammdaten-status-phase-netzebene-firmen).
:::

Ob ein Typ in der Karte überhaupt gezeichnet wird, stellen Sie nicht hier, sondern in der Legende des Kartenfensters ein.

## 17.6 Kabelfarben

Der Abschnitt „Kabelfarbe“ betrifft allein das Netzschema. Der „Farbmodus“ bestimmt, wonach sich die Farbe einer Kabellinie richtet:

- **„Standard (Grün)“** – alle Kabel grün, unabhängig von allem anderen.
- **„Verknüpfungsanzeige (Grün/Blau)“** – **blau**, sobald das Kabel mit mindestens einem Mikrorohr verknüpft ist, und **grün**, solange es mit keinem verknüpft ist. Grün ist hier also das Warnsignal: Diese Kabel liegen in keinem dokumentierten Rohr.
- **„Mikrorohrfarbe“** – die Farbe des Mikrorohrs mit der niedrigsten Nummer, mit dem das Kabel verknüpft ist. Die Voreinstellung.

![Screenshot der Einstellungen mit den Abschnitten „Kabelfarbe“ und „Rohrzuordnung“](/images/manual/teil-a/settings_cable_routing.jpg)

::: warning
Grün hat in zwei Modi eine andere Bedeutung: In „Standard (Grün)“ sind alle Kabel grün, in „Mikrorohrfarbe“ dagegen nur die, für die keine Farbe zu ermitteln ist – ein Kabel ohne Verknüpfung oder mit einem Mikrorohr ohne hinterlegte Farbe. Aus der Farbe allein lässt sich der Zustand eines Kabels also nur ablesen, wenn Sie wissen, welcher Modus eingestellt ist.
:::

Verknüpft werden Kabel und Mikrorohr im Netzschema, siehe Abschnitt [Kabel mit Mikrorohren verknüpfen](./14-netzschema.md#_14-5-kabel-mit-mikrorohren-verknupfen).

## 17.7 Rohrzuordnung: Routing-Toleranz

Der Abschnitt „Rohrzuordnung“ enthält den Regler „Routing-Toleranz“ mit den Stufen 1 bis 10, voreingestellt 1.

Beim Routing sucht Qonnectra einen Weg durch das Trassennetz und muss dazu entscheiden, welche Trassen aneinanderstoßen. Dafür legt es ein Raster über das Projekt und rundet jeden Trassenendpunkt auf die nächste Rasterlinie; Endpunkte, die danach übereinanderliegen, gelten als derselbe Punkt. Die Toleranz ist die Maschenweite dieses Rasters in Metern. Wie Sie den Routing-Modus verwenden, beschreibt Abschnitt [Routing-Toleranz richtig wählen](./11-rohrzuordnung.md#_11-4-routing-toleranz-richtig-wahlen).

::: warning
Eine hohe Toleranz hilft bei ungenau erfassten Trassen, verbindet aber auch Trassen, die im Gelände nichts miteinander zu tun haben – etwa zwei auf gegenüberliegenden Straßenseiten. Der berechnete Weg ist dann kürzer, als er sein dürfte. Erhöhen Sie den Wert deshalb schrittweise und nur so weit, bis das Routing zustande kommt.
:::

::: info
Weil gerundet und nicht gemessen wird, ist die Toleranz keine Garantie: Zwei Endpunkte, die knapp beieinander, aber beiderseits einer Rasterlinie liegen, bleiben getrennt. Eine Lücke, die sich bei Stufe 2 nicht schließt, kann bei Stufe 3 verschwinden – oder erst bei 4.
:::

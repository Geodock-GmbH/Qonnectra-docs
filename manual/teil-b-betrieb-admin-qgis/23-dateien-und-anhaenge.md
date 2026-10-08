# 23. Dateien und Anhänge verwalten

Die Dateien, die Nutzende im Reiter „Anhänge“ hochladen, legt Qonnectra auf dem Server in einer festen Ordnerstruktur ab, siehe Abschnitt [Anhänge hochladen, ansehen und löschen](../teil-a-anwenderhandbuch/03-wiederkehrende-bedienelemente.md#_3-7-anhange-hochladen-ansehen-und-loschen). Dieses Kapitel beschreibt, wie diese Struktur entsteht, wie Sie sie anpassen und wie Sie aufräumen, wenn Anhänge ihr Objekt verloren haben.

Zu jeder Datei gibt es zwei Dinge: die Datei selbst im Ablageordner und einen Eintrag unter „Api“ → „Feature-Dateien“, der sie mit ihrem Objekt verbindet. Der Reiter „Anhänge“ zeigt nur Dateien, zu denen es diesen Eintrag gibt.

## 23.1 Ablagestruktur der Anhänge

Eine hochgeladene Datei landet unter diesem Pfad:

`Projekt/Objektordner/Objektkennung/Kategorieordner/Dateiname`

- **Projekt** – der Name des Projekts, zu dem das Objekt gehört.
- **Objektordner** – je Objektart ein Ordner, etwa `trenches` für Trassen oder `nodes` für Netzknoten.
- **Objektkennung** – die Trassen-ID, der Name eines Rohrs, Kabels, Netzknotens oder Gebiets, bei Adressen die Anschrift.
- **Kategorieordner** – ergibt sich aus der Dateiendung, siehe Abschnitt [Dateitypkategorien](#_23-2-dateitypkategorien).

Die Anhänge einer Wohneinheit liegen im Ordner ihrer Adresse.

Welche Ordnernamen gelten, legen die „Speicherpräferenzen“ fest. Es gibt genau einen Eintrag; sein Feld „Folder structure“ ordnet jeder Objektart und jeder Kategorie einen Ordner zu. Für Kabel enthält der mitgelieferte Eintrag keine Zuordnung; ihre Anhänge liegen deshalb ohne Kategorieordner direkt im Ordner des Kabels unter `cables`.

![Screenshot der Speicherpräferenzen mit der Zuordnung von Objektarten und Kategorien zu Ordnern im Feld „Folder structure“ in der Mitte](/images/manual/teil-b/admin_storage_preferences.jpg)

::: warning
Eine geänderte Ordnerstruktur gilt nur für Dateien, die danach hochgeladen werden. Vorhandene Dateien bleiben, wo sie sind, und ihre Einträge verweisen weiter dorthin. Wer die Struktur ändert, hat danach zwei Ordnungen nebeneinander.
:::

Benennen Sie in der Weboberfläche oder im Administrationsbereich ein Rohr, ein Kabel, einen Netzknoten, eine Adresse oder eine Wohneinheit um, oder bekommt eine Trasse eine neue ID, verschiebt Qonnectra den Ordner mit. Ein Umbenennen in QGIS bewegt nichts, und auch ein umbenanntes Gebiet behält seinen Ordner; die Anhänge bleiben trotzdem erreichbar, nur der Ordnername passt nicht mehr.

## 23.2 Dateitypkategorien

Die **Dateitypkategorien** ordnen jeder Dateiendung eine Kategorie zu, etwa `jpg` den Fotos oder `pdf` den Dokumenten. Sie stehen unter „Dateitypkategorien“, eine Zeile je Endung in der Form „jpg → photos“; die „Beschreibung“ zeigt erst das Formular einer Zeile.

![Screenshot der Liste der Dateitypkategorien mit Endung und Kategorie je Zeile im Inhaltsbereich](/images/manual/teil-b/admin_file_type_categories.jpg)

Mitgeliefert sind die Kategorien `photos`, `documents`, `cad`, `data`, `archives` und `videos`. Eine Endung, die in der Liste fehlt, gilt als Dokument. Eine neue Kategorie braucht zusätzlich einen Ordner in den Speicherpräferenzen; sonst landen ihre Dateien direkt im Ordner des Objekts.

::: info
Die Liste beschränkt nicht, was hochgeladen werden darf. Sie entscheidet nur über den Ordner. Jede Dateiart wird angenommen.
:::

## 23.3 Größen- und Formatgrenzen

Für die Größe einer Datei gelten zwei Grenzen, je nach Weg:

| Weg | Grenze |
|---|---|
| Reiter „Anhänge“ der Weboberfläche | 50 MB je Datei |
| Administrationsbereich und Schnittstelle | 100 MB je Anfrage |

Größere Dateien – Videos von Befahrungen, Punktwolken, umfangreiche CAD-Pläne – nimmt Qonnectra nicht als Anhang an. Legen Sie sie an anderer Stelle ab und verweisen Sie in der Beschreibung eines Anhangs darauf.

Eine zweite Datei mit demselben Namen am selben Objekt überschreibt die erste, siehe den Hinweis in Abschnitt [Anhänge hochladen, ansehen und löschen](../teil-a-anwenderhandbuch/03-wiederkehrende-bedienelemente.md#_3-7-anhange-hochladen-ansehen-und-loschen).

## 23.4 Zugriff auf die Medien über WebDAV

Der Ablageordner ist zusätzlich über **WebDAV** erreichbar, unter einer eigenen Adresse, die mit `files.` beginnt, etwa `https://files.ihre-domain.de`. Angemeldet wird mit Benutzername und Passwort aus Qonnectra.

In der mitgelieferten Konfiguration ist der Zugang schreibgeschützt: Sie können Dateien ansehen und herunterladen, aber nicht ablegen, ändern oder löschen. Er eignet sich, um die Anhänge eines Projekts gesammelt zu kopieren, etwa für eine Übergabe.

::: warning
WebDAV kennt keine Rollen und keine Projekte. Jedes aktive Konto liest dort alle Anhänge aller Projekte – auch ein Konto der Rolle „Viewer“ und auch ein Konto, das in der Weboberfläche keine einzige Objektart sehen darf. Geben Sie die Adresse nur weiter, wo der Zugang gebraucht wird; sperren lässt er sich nur auf Ebene des Servers, siehe Kapitel [Betrieb der Instanz](./28-betrieb-der-instanz.md).
:::

## 23.5 Verwaiste Dateien finden, verschieben und löschen

Wird ein Objekt gelöscht – in der Weboberfläche, im Administrationsbereich oder in QGIS –, bleiben seine Anhänge zurück: die Dateien im Ablageordner und ihre Einträge unter „Feature-Dateien“. Solche **verwaisten Dateien** zeigt die Liste der Feature-Dateien, wenn Sie rechts unter „Verwaist-Status“ den Filter „Nur verwaiste Dateien“ wählen.

![Screenshot der Feature-Dateien, gefiltert auf verwaiste Dateien, mit Hervorhebung des Filters und der Aktionen](/images/manual/teil-b/admin_feature_files.jpg)

Für verwaiste Dateien gibt es zwei Aktionen:

- „Ausgewählte Dateien zu einem anderen Feature verschieben“ – hängt die Dateien an ein anderes Objekt. Das ist der Weg, wenn ein Objekt gelöscht und neu angelegt wurde, etwa ein Netzknoten nach einer Korrektur in QGIS.
- „Ausgewählte verwaiste Dateien und ihre Daten löschen“ – löscht Einträge und Dateien. Dateien, deren Objekt noch existiert, überspringt die Aktion.

Zum Verschieben:

1. Haken Sie die Dateien an, wählen Sie die Aktion „Ausgewählte Dateien zu einem anderen Feature verschieben“ und klicken Sie auf „Ausführen“.
2. Wählen Sie im folgenden Formular unter „Feature-Typ“ die Objektart und tragen Sie unter „Feature-UUID“ die UUID des neuen Objekts ein. Sie steht im Formular des Objekts im Administrationsbereich im Feld „Uuid“.
3. Klicken Sie auf „Dateien verschieben“.

![Screenshot des Formulars zum Verschieben verwaister Dateien mit der Liste der ausgewählten Dateien oben und dem Ziel darunter](/images/manual/teil-b/admin_move_files.jpg)

::: warning
Die gewöhnliche Aktion „Ausgewählte … löschen“ fehlt in dieser Liste mit Absicht: Sie würde nur die Einträge entfernen und die Dateien als unauffindbaren Rest im Ablageordner lassen. Die Schaltfläche „Löschen“ im Formular einer einzelnen Feature-Datei gibt es dagegen weiterhin, und sie tut genau das: Der Eintrag verschwindet, die Datei bleibt zurück. Löschen Sie Anhänge deshalb immer über die Aktion für verwaiste Dateien oder im Reiter „Anhänge“.
:::

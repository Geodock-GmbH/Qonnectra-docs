# Testdaten für lokale Handbuch-Screenshots

`testprojekt-export.json` ist ein 1:1-Export des echten Projekts
**"Testprojekt"** von app.geodock.de (Netzknoten, Trassen, Rohre, Adressen,
Kabel, Fasern, Mikrorohre, Gebiete inkl. der dazugehörigen Referenzdaten wie
Firmen, Rohr-/Kabeltypen und Kennzeichen). `scripts/setup-local-qonnectra.sh`
spielt diese Datei automatisch in eine frische lokale Instanz ein.

Bewusst **nicht** enthalten: Container/ContainerType, FiberSplice,
NodeStructure/Slot-Konfiguration (Patch-Panel-Modellierung) und
NetworkSchemaSettings (welche Netzknotentypen im Netzschema ausgeblendet
werden) - diese sind (noch) nicht Teil des Handbuch-Umfangs bzw. hatten
keinen passenden API-Endpunkt zum Export.

## Daten aktualisieren

Der Export wurde per Browser-Skript (JavaScript, gegen die eingeloggte
Session auf app.geodock.de) erzeugt, da es keinen fertigen "Alles
exportieren"-Knopf in der App gibt. Kurzfassung, falls die Daten irgendwann
neu gezogen werden müssen:

1. In app.geodock.de einloggen (im Browser).
2. Über die Browser-Konsole/DevTools gegen `https://api.geodock.de/api/v1/`
   für jede benötigte Ressource (`trench`, `conduit`,
   `trench_conduit_connection`, `microduct`, `microduct_connection`,
   `microduct_cable_connection`, `node`, `address`, `residential-unit`,
   `cable`, `cable_label`, `fiber`, `area` jeweils mit `?project=<id>`,
   sowie die globalen `attributes_*`- und `flags`-Listen ohne Projektfilter)
   alle Seiten abrufen und zu einem JSON-Objekt zusammenführen.
   Achtung: `trench`, `node`, `address` und `area` liefern pro Seite eine
   GeoJSON-`FeatureCollection` (`results.features`), alle anderen Ressourcen
   ein einfaches `results`-Array - siehe `import_geodock_export.py` für die
   genaue Verarbeitungslogik.
3. Als JSON-Datei speichern und mit `import_geodock_export.py --file ... --force`
   in die lokale Instanz einspielen.

## Import-Command

`import_geodock_export.py` wird von `setup-local-qonnectra.sh` nach
`local-app/backend/apps/api/management/commands/` kopiert (lokal-app/ ist
gitignored und wird bei jedem Lauf neu aus dem Checkout ergänzt). Danach:

```bash
python manage.py import_geodock_export --file /pfad/zur/datei.json [--force]
```

Ohne `--force` wird ein bereits vorhandenes lokales Projekt "Testprojekt"
übersprungen (kein erneuter Import). Mit `--force` wird es vorher komplett
gelöscht und neu importiert.

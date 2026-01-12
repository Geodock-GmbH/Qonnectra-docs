# Qonnectra Handbuch

Willkommen im Qonnectra-Handbuch. Dieser Abschnitt enthält umfassende Anleitungen und Anweisungen zur Verwendung von Qonnectra zur Dokumentation und Verwaltung kommunaler Netzinfrastrukturen.

## Einführung

Qonnectra ist ein modernes Dokumentationssystem, das speziell für kommunale Netzinfrastrukturen entwickelt wurde. Es ermöglicht Netzbetreibern und Verwaltungen, ihre Netzinfrastruktur effizient über eine browserbasierte Oberfläche zu dokumentieren, zu verwalten und zu analysieren.

## Erste Schritte

### Systemanforderungen

Vor der Installation von Qonnectra sollten Sie sicherstellen, dass Ihr System die folgenden Anforderungen erfüllt:

- **Betriebssystem**: Linux (empfohlen), macOS oder Windows
- **Docker**: Version 20.10 oder höher
- **Docker Compose**: Version 2.0 oder höher
- **Web-Browser**: Moderner Browser mit aktiviertem JavaScript (Chrome, Firefox, Safari, Edge)

### Installation

Qonnectra kann mit Docker installiert werden, was den Einrichtungsprozess vereinfacht:

```bash
# Repository klonen
git clone https://github.com/Geodock-GmbH/Qonnectra.git
cd Qonnectra

# Anwendung mit Docker Compose starten
docker-compose up -d
```

Die Anwendung ist nach dem Start unter `http://localhost:8000` verfügbar.

### Erste Konfiguration

1. **Zugriff auf das Admin-Panel**: Navigieren Sie zu `http://localhost:8000/admin`
2. **Superuser erstellen**: Führen Sie `python manage.py createsuperuser` im Container aus
3. **Datenbank konfigurieren**: Die PostgreSQL-Datenbank wird automatisch über Docker eingerichtet
4. **Basisdaten importieren**: Verwenden Sie die Admin-Oberfläche, um erste Netzwerkdaten zu importieren

## Kernfunktionen

### Browserbasierte Kartenansicht

Die Kartenansicht ist die zentrale Komponente von Qonnectra. Sie bietet:

- **Interaktive Karte**: Navigieren und Zoomen in verschiedene Bereiche Ihres Netzwerks
- **Ebenenverwaltung**: Ein- und Ausblenden verschiedener Netzwerkebenen
- **Netzabfragen**: Abfragen von Netzwerkdaten direkt von der Karte
- **Messungen**: Messen von Entfernungen und Flächen auf der Karte

### Netzdokumentation

Dokumentieren Sie alle Ebenen Ihrer Netzinfrastruktur:

- **Hauptverteiler**: Dokumentieren Sie zentrale Verteilungspunkte
- **Sekundärnetze**: Verfolgen Sie Zwischennetzebenen
- **Hausanschlüsse**: Verwalten Sie einzelne Anschlüsse
- **Glasfaserkabel**: Dokumentieren Sie die Glasfaserinfrastruktur
- **Rohrverbände**: Verfolgen Sie Rohrnetze

### Datenintegration

Qonnectra integriert verschiedene Datentypen:

- **Geodaten**: Räumliche Informationen über Netzwerkkomponenten
- **Technische Daten**: Spezifikationen, Kapazitäten und technische Parameter
- **Verwaltungsdaten**: Gewährleistungsfristen, Wartungspläne, Abnahmen
- **Dokumente**: Bohrprotokolle, Belegungspläne und andere Dokumentationen

## Verwendungsbeispiele

### Hinzufügen einer Netzwerkkomponente

```python
# Beispiel: Hinzufügen eines neuen Netzwerkknotens über die API
import requests

url = "http://localhost:8000/api/network/nodes/"
data = {
    "name": "Node-001",
    "type": "distributor",
    "coordinates": {
        "latitude": 54.3233,
        "longitude": 10.1394
    },
    "properties": {
        "capacity": 1000,
        "status": "active"
    }
}

response = requests.post(url, json=data, headers={
    "Authorization": "Token YOUR_API_TOKEN"
})
```

### Abfragen von Netzwerkdaten

```python
# Beispiel: Abfragen von Netzwerkkomponenten in einem bestimmten Bereich
import requests

url = "http://localhost:8000/api/network/nodes/"
params = {
    "bbox": "10.0,54.0,10.2,54.2",  # Begrenzungsrahmen
    "type": "distributor",
    "status": "active"
}

response = requests.get(url, params=params)
nodes = response.json()
```

## Nächste Schritte

- Lesen Sie den [Best Practices](/de/best-practices/)-Leitfaden für empfohlene Workflows
- Erkunden Sie die [API-Dokumentation](/de/manual/api/) für programmatischen Zugriff
- Schauen Sie sich den [Bereitstellungsleitfaden](/de/manual/deployment/) für die Produktionseinrichtung an

## Weitere Ressourcen

- [Offizielle Website](https://qonnectra.de)
- [GitHub-Repository](https://github.com/Geodock-GmbH/Qonnectra)
- [Community-Forum](https://github.com/Geodock-GmbH/Qonnectra/discussions)


# Qonnectra Manual

Welcome to the Qonnectra manual. This section contains comprehensive guides and instructions for using Qonnectra to document and manage municipal network infrastructures.

## Introduction

Qonnectra is a modern documentation system designed specifically for municipal network infrastructures. It enables network operators and administrations to efficiently document, manage, and analyze their network infrastructure through a browser-based interface.

## Getting Started

### System Requirements

Before installing Qonnectra, ensure your system meets the following requirements:

- **Operating System**: Linux (recommended), macOS, or Windows
- **Docker**: Version 20.10 or higher
- **Docker Compose**: Version 2.0 or higher
- **Web Browser**: Modern browser with JavaScript enabled (Chrome, Firefox, Safari, Edge)

### Installation

Qonnectra can be installed using Docker, which simplifies the setup process:

```bash
# Clone the repository
git clone https://github.com/Geodock-GmbH/Qonnectra.git
cd Qonnectra

# Start the application using Docker Compose
docker-compose up -d
```

The application will be available at `http://localhost:8000` after startup.

### Initial Configuration

1. **Access the Admin Panel**: Navigate to `http://localhost:8000/admin`
2. **Create Superuser**: Run `python manage.py createsuperuser` in the container
3. **Configure Database**: The PostgreSQL database is automatically set up via Docker
4. **Import Base Data**: Use the admin interface to import initial network data

## Core Features

### Browser-based Map View

The map view is the central component of Qonnectra. It provides:

- **Interactive Map**: Navigate and zoom to different areas of your network
- **Layer Management**: Show/hide different network layers
- **Network Inquiries**: Query network data directly from the map
- **Measurements**: Measure distances and areas on the map

### Network Documentation

Document all levels of your network infrastructure:

- **Main Distributors**: Document central distribution points
- **Secondary Networks**: Track intermediate network levels
- **House Connections**: Manage individual connections
- **Fiber Optic Cables**: Document fiber infrastructure
- **Pipe Associations**: Track pipe networks

### Data Integration

Qonnectra integrates various types of data:

- **Geodata**: Spatial information about network components
- **Technical Data**: Specifications, capacities, and technical parameters
- **Administrative Data**: Warranty periods, maintenance schedules, acceptances
- **Documents**: Drilling protocols, occupancy plans, and other documentation

## Usage Examples

### Adding a Network Component

```python
# Example: Adding a new network node via API
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

### Querying Network Data

```python
# Example: Query network components in a specific area
import requests

url = "http://localhost:8000/api/network/nodes/"
params = {
    "bbox": "10.0,54.0,10.2,54.2",  # Bounding box
    "type": "distributor",
    "status": "active"
}

response = requests.get(url, params=params)
nodes = response.json()
```

## Next Steps

- Read the [Best Practices](/best-practices/) guide for recommended workflows
- Explore the [API Documentation](/manual/api/) for programmatic access
- Check out [Deployment Guide](/manual/deployment/) for production setup

## Additional Resources

- [Official Website](https://qonnectra.de)
- [GitHub Repository](https://github.com/Geodock-GmbH/Qonnectra)
- [Community Forum](https://github.com/Geodock-GmbH/Qonnectra/discussions)

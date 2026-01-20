# Proxmox REST API

> REST API wrapper for Proxmox VE - HTTP equivalent of [gilby125/mcp-proxmox](https://github.com/gilby125/mcp-proxmox) MCP server

## Overview

This project provides a complete REST API interface for Proxmox Virtual Environment, mirroring the functionality of the gilby125/mcp-proxmox Model Context Protocol (MCP) server but over HTTP/HTTPS.

## Features

✅ **7 REST Endpoints** mapping to original MCP tools
✅ **Two Permission Modes**: Basic (safe operations) and Elevated (full access)
✅ **Complete OpenAPI 3.0.3 Specification** with Swagger UI
✅ **Docker & Docker Compose** ready
✅ **Production-ready** with error handling, logging, and health checks

## Quick Start

### Installation

```bash
# Clone repository
git clone https://github.com/StaRipper/proxmox-rest-api.git
cd proxmox-rest-api

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Proxmox credentials

# Run
npm start
```

### Docker

```bash
# Using docker-compose
docker-compose up -d

Create a `docker-compose.yml` file in the project root:

```yaml
version: '3.8'

services:
  proxmox-rest-api:
    build: .
    container_name: proxmox-rest-api
    ports:
      - "3000:3000"
    env_file:
      - .env
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/api/cluster/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

Then run:

```bash
# Start the service
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the service
docker-compose down
```

# Or build manually
docker build -t proxmox-rest-api .
docker run -p 3000:3000 --env-file .env proxmox-rest-api
```

## Configuration

Create a `.env` file with your Proxmox credentials:

```env
PROXMOX_HOST=192.168.1.100
PROXMOX_PORT=8006
PROXMOX_USER=root@pam
PROXMOX_TOKEN_NAME=mcp-server
PROXMOX_TOKEN_VALUE=your-token-secret-here
PROXMOX_VERIFY_SSL=false
PROXMOX_ALLOW_ELEVATED=false
PORT=3000
NODE_ENV=production
```

### Proxmox API Token Setup

1. Login to Proxmox web interface
2. Navigate to **Datacenter** → **Permissions** → **API Tokens**
3. Click **Add** to create new token
4. For **Basic mode**: Grant `VM.Audit`, `Sys.Audit` permissions
5. For **Elevated mode**: Add `VM.Monitor`, `VM.Console`, `Sys.Audit`

## API Endpoints

### Basic Mode (Always Available)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/nodes` | GET | List all cluster nodes |
| `/vms` | GET | List all VMs and containers |
| `/vms/:node/:vmid` | GET | Get VM/container status |
| `/storage` | GET | List storage pools |
| `/cluster/health` | GET | Get cluster health status |

### Elevated Mode (Requires `PROXMOX_ALLOW_ELEVATED=true`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/nodes/:node` | GET | Get detailed node status |
| `/vms/:node/:vmid/command` | POST | Execute command on VM |

### Example Requests

```bash
# Health check
curl http://localhost:3000/health

# List nodes
curl http://localhost:3000/nodes

# List all VMs
curl http://localhost:3000/vms

# List VMs on specific node
curl http://localhost:3000/vms?node=pve

# Get VM status
curl http://localhost:3000/vms/pve/100?type=qemu

# Execute command (elevated)
curl -X POST http://localhost:3000/vms/pve/100/command \
  -H "Content-Type: application/json" \
  -d '{"command": "uptime", "type": "qemu"}'
```

## Documentation

### OpenAPI / Swagger UI

- **Swagger UI**: http://localhost:3000/api/docs
- **ReDoc**: http://localhost:3000/api/docs/redoc
- **OpenAPI JSON**: http://localhost:3000/api/openapi.json

## Project Structure

```
proxmox-rest-api/
├── src/
│   ├── index.js              # Express app entry point
│   ├── config.js             # Environment configuration
│   ├── proxmoxClient.js      # Proxmox API client
│   ├── middleware/
│   │   ├── auth.js           # Permission checks
│   │   └── errorHandler.js   # Error handling
│   └── routes/
│       ├── nodes.js          # Node management
│       ├── vms.js            # VM management
│       ├── storage.js        # Storage management
│       ├── cluster.js        # Cluster health
│       └── openapi.js        # OpenAPI spec
├── public/
│   └── swagger-ui.html       # Swagger UI page
├── package.json
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── openapi.json              # OpenAPI 3.0.3 spec
└── README.md
```

## Comparison with MCP Server

| Feature | MCP Server | REST API |
|---------|------------|----------|
| Protocol | stdio (MCP) | HTTP/HTTPS |
| Integration | Claude, Cline | Any HTTP client |
| Tools/Endpoints | 7 tools | 7 REST endpoints |
| Permissions | BASIC/ELEVATED | BASIC/ELEVATED |
| Auth | Proxmox token | Proxmox token |
| Documentation | README | OpenAPI + Swagger |

## Integration Examples

### n8n Workflow

```json
{
  "nodes": [
    {
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "http://localhost:3000/vms",
        "method": "GET"
      }
    }
  ]
}
```

### Python

```python
import requests

response = requests.get('http://localhost:3000/nodes')
nodes = response.json()['data']
for node in nodes:
    print(f"{node['node']}: {node['status']}")
```

### cURL

```bash
# Get all VMs as JSON
curl -s http://localhost:3000/vms | jq '.data'
```

## Security

- ✅ Proxmox API token authentication
- ✅ Two-tier permission model (Basic/Elevated)
- ✅ Environment-based configuration
- ✅ SSL verification configurable
- ⚠️ Add reverse proxy with TLS in production
- ⚠️ Implement API key authentication if exposing publicly

## Troubleshooting

### Connection Issues

```bash
# Test Proxmox connection
curl -k https://PROXMOX_HOST:8006/api2/json/nodes

# Check API token
curl -k -H "Authorization: PVEAPIToken=USER!TOKEN_NAME=TOKEN_VALUE" \
  https://PROXMOX_HOST:8006/api2/json/nodes
```

### Permission Errors

- Verify token has required permissions in Proxmox
- For elevated operations, set `PROXMOX_ALLOW_ELEVATED=true`
- Check Proxmox audit log for auth failures

## Development

```bash
# Install dev dependencies
npm install

# Run with auto-reload
npm run dev

# Validate OpenAPI spec
npx @apidevtools/swagger-cli validate openapi.json
```

## License

MIT

## Credits

Based on [gilby125/mcp-proxmox](https://github.com/gilby125/mcp-proxmox) MCP server.

## Contributing

Pull requests welcome! Please ensure:

1. Code follows existing style
2. All endpoints tested
3. OpenAPI spec updated
4. README updated if needed

---

**Made with ❤️ for Proxmox automation**

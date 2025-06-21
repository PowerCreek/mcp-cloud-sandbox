# Sandboxed MCP Architecture

This setup provides a sandboxed environment for AI agents with HTTP-based Model Context Protocol (MCP) tools.

## Architecture Overview

```
┌─────────────────┐    HTTP     ┌─────────────────┐    stdio    ┌─────────────────┐
│                 │  Requests   │                 │             │                 │
│ Agentic Sandbox├────────────►│   MCP Gateway   ├────────────►│   MCP Servers   │
│   Container     │             │   Container     │             │  (Native Tools) │
│                 │◄────────────┤                 │◄────────────┤                 │
└─────────────────┘  Responses  └─────────────────┘             └─────────────────┘
```

## Components

### 1. Agentic Sandbox (`agentic-sandbox`)
- Isolated container for running AI agents
- Uses HTTP MCP client configuration
- Communicates with gateway over Docker network
- Configuration: `sandbox/container/mcp.json`

### 2. MCP Gateway (`mcp-gateway`) 
- Node.js Express server using MCP TypeScript SDK
- Proxies HTTP requests to native MCP servers
- Handles protocol translation (HTTP ↔ stdio)
- Provides service discovery and health checks

### 3. MCP Servers (Native)
- Original MCP tools (browser-agent, context7, supabase, etc.)
- Run as child processes of the gateway
- Communicate via stdio transport
- Located in `/workspaces/resource-setup-scratch/init/`

## Quick Start

### 1. Build the Environment
```bash
cd sandbox
./build.sh
```

### 2. Start the Services
```bash
# Production mode
docker-compose up -d

# Development mode (with live reloading)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### 3. Verify the Setup
```bash
# Check container status
docker-compose ps

# Test gateway health
curl http://localhost:8080/health

# List available MCP services
curl http://localhost:8080/services
```

### 4. Test MCP Tools
```bash
# From the gateway container
cd ../sandbox-template
npm test
```

## Directory Structure

```
cloud-dev/
├── sandbox/                    # Sandbox container configuration
│   ├── container/             # Container-specific files
│   │   └── mcp.json          # HTTP MCP configuration for sandbox
│   ├── docker-compose.yml    # Main compose file
│   ├── docker-compose.dev.yml # Development overrides
│   ├── build.sh             # Build script
│   └── Dockerfile           # Sandbox container image
│
├── sandbox-template/          # MCP Gateway server
│   ├── server.js            # Gateway implementation
│   ├── test-client.js       # Test client example
│   ├── package.json         # Node.js dependencies
│   ├── Dockerfile          # Gateway container image
│   └── README.md           # Gateway documentation
│
└── init/                     # Original MCP server scripts
    ├── run-browser-agent-mcp.sh
    ├── run-context7-mcp.sh
    └── ...
```

## MCP Service Endpoints

All services are available via HTTP at:
```
http://mcp-gateway:8080/mcp/{service-name}
```

Available services:
- `browser-agent` - Browser automation
- `context7` - Documentation lookup  
- `supabase` - Database operations
- `sequential-thinking` - Structured problem solving
- `neo4j-aura` - Neo4j cloud management
- `neo4j-cypher` - Cypher query execution
- `neo4j-data-modeling` - Data modeling tools
- `neo4j-memory` - Knowledge graph operations

## Environment Variables

Copy your `.env` file to the root directory with:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- Plus any other environment variables needed by MCP servers

## Troubleshooting

### Gateway Not Starting
```bash
# Check gateway logs
docker-compose logs mcp-gateway

# Check if gateway container is healthy
docker-compose ps
```

### MCP Tools Not Working
```bash
# Test individual service
curl -X POST http://localhost:8080/mcp/context7 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
```

### Sandbox Connection Issues
```bash
# Check network connectivity from sandbox
docker-compose exec agentic-sandbox curl http://mcp-gateway:8080/health
```

## Development

### Live Reloading
Use the development compose file for live code changes:
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

### Adding New MCP Services
1. Add service configuration to `sandbox-template/server.js` in `MCP_SERVICES`
2. Add HTTP endpoint to `sandbox/container/mcp.json`
3. Rebuild and restart containers

### Custom MCP Client
See `sandbox-template/test-client.js` for an example HTTP MCP client implementation.

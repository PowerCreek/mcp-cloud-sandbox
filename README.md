# MCP Cloud Development Sandbox

A containerized Model Context Protocol (MCP) development environment with HTTP gateway, event bus logging, and modular service architecture.

## 🏗️ Architecture

This sandbox provides a complete MCP development environment with:

- **MCP Gateway**: HTTP proxy with capability propagation and event bus logging
- **Containerized Services**: Individual MCP services for Neo4j, Supabase, Sequential Thinking, etc.
- **Event Bus Logging**: Complete request/response visibility for debugging
- **VS Code Integration**: HTTP-based MCP server configuration

## 🚀 Quick Start

1. **Start the sandbox**:
   ```bash
   cd sandbox
   ./build.sh
   ```

2. **Test endpoints**:
   ```bash
   curl http://localhost:8080/health
   ```

3. **Restart VS Code** to load MCP servers

## 📁 Project Structure

```
├── sandbox/                           # Main sandbox environment
│   ├── docker-compose.yml            # Main services
│   ├── docker-compose.mcp-services.yml # MCP services
│   ├── build.sh                      # Build script
│   └── build-mcp-bridge.sh          # MCP bridge build script
├── sandbox-template/                 # Service templates
│   ├── mcp-gateway/                  # HTTP gateway with event bus
│   ├── mcp-http-bridge/             # HTTP bridge for MCP services
│   ├── Dockerfile                   # Main service Dockerfile
│   └── Dockerfile.mcp-service       # MCP service Dockerfile
├── .vscode/
│   └── mcp.json                     # VS Code MCP configuration
└── init/                            # Initialization scripts
```

## 🛠️ Services

### MCP Gateway (Port 8080)
- **Purpose**: HTTP proxy for all MCP services
- **Features**: Capability propagation, event bus logging, notification handling
- **Endpoints**: `http://localhost:8080/mcp/{service-name}`

### Available MCP Services:
- **sequential-thinking** (Port 3006): Dynamic problem-solving through structured thoughts
- **neo4j-memory** (Port 3001): Graph-based memory management
- **neo4j-cypher** (Port 3002): Cypher query execution
- **neo4j-data-modeling** (Port 3003): Graph data modeling tools
- **neo4j-aura** (Port 3004): Neo4j Aura cloud integration
- **supabase** (Port 3005): Supabase database operations

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the `sandbox/` directory:

```env
# Neo4j Configuration
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=password123

# Neo4j Aura Configuration
NEO4J_AURA_INSTANCE_ID=your-instance-id
NEO4J_AURA_INSTANCE_USERNAME=neo4j
NEO4J_AURA_INSTANCE_PASSWORD=your-password

# Supabase Configuration
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### VS Code MCP Configuration
The `.vscode/mcp.json` file configures HTTP endpoints for VS Code:

```json
{
  "servers": {
    "sequential-thinking-http": {
      "type": "http",
      "url": "http://localhost:8080/mcp/sequential-thinking"
    }
    // ... other services
  }
}
```

## 🏃‍♂️ Usage

### Using MCP Tools in VS Code
1. Start the sandbox with `./build.sh`
2. Restart VS Code to load MCP configuration
3. MCP tools will be available in GitHub Copilot

### Direct API Testing
```bash
# Test tool discovery
curl -X POST http://localhost:8080/mcp/sequential-thinking \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":1}'

# Test tool execution
curl -X POST http://localhost:8080/mcp/sequential-thinking \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "method":"tools/call",
    "params":{
      "name":"sequentialthinking",
      "arguments":{
        "thought":"What are the benefits of containerized MCP services?",
        "nextThoughtNeeded":false,
        "thoughtNumber":1,
        "totalThoughts":1
      }
    },
    "id":2
  }'
```

## 🔍 Debugging

### Event Bus Logs
Monitor gateway logs for complete request/response flow:
```bash
docker logs mcp-gateway --follow
```

### Service Health Checks
```bash
# Gateway health
curl http://localhost:8080/health

# Individual service health
curl http://localhost:3006/health  # sequential-thinking
curl http://localhost:3001/health  # neo4j-memory
```

## 🏗️ Development

### Building Individual Services
```bash
cd sandbox
./build-mcp-bridge.sh  # Build MCP HTTP bridge services
```

### Adding New MCP Services
1. Create entrypoint script in `sandbox-template/`
2. Add service configuration to `docker-compose.mcp-services.yml`
3. Update gateway configuration in `mcp-gateway/server.js`
4. Add VS Code configuration to `.vscode/mcp.json`

## 🔐 Security

- Services run in isolated containers
- HTTP-based communication (no direct stdio access)
- Event bus logging for audit trails
- Environment variables for sensitive configuration

## 📖 MCP Protocol

This sandbox implements the Model Context Protocol (MCP) specification:
- JSON-RPC 2.0 based communication
- Capability negotiation during initialization
- Tool, resource, and prompt support
- Proper notification handling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with the sandbox environment
5. Submit a pull request

## 📝 License

[Add your license information here]

## 🔗 Links

- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [VS Code MCP Extension](https://marketplace.visualstudio.com/items?itemName=modelcontextprotocol.mcp-vscode)

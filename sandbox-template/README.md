# MCP Gateway Server

This directory contains the HTTP gateway server for Model Context Protocol (MCP) tools in the sandboxed environment.

## Architecture

```
Sandbox Container → HTTP Requests → Gateway Container → MCP Servers
```

The gateway receives HTTP requests on different paths and proxies them to the actual MCP servers:

- `http://mcp-gateway:8080/mcp/browser-agent` → Browser automation MCP server
- `http://mcp-gateway:8080/mcp/context7` → Context7 documentation lookup
- `http://mcp-gateway:8080/mcp/supabase` → Supabase database operations  
- `http://mcp-gateway:8080/mcp/sequential-thinking` → Sequential thinking tool
- `http://mcp-gateway:8080/mcp/neo4j-aura` → Neo4j Aura management
- `http://mcp-gateway:8080/mcp/neo4j-cypher` → Neo4j Cypher queries
- `http://mcp-gateway:8080/mcp/neo4j-data-modeling` → Neo4j data modeling
- `http://mcp-gateway:8080/mcp/neo4j-memory` → Neo4j knowledge graph

## API Endpoints

### Health Check
```bash
GET http://mcp-gateway:8080/health
```

### List Services
```bash
GET http://mcp-gateway:8080/services
```

### MCP Operations
All MCP operations follow the JSON-RPC 2.0 protocol:

```bash
POST http://mcp-gateway:8080/mcp/{service-name}
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "id": 1
}
```

Supported methods:
- `tools/list` - List available tools
- `tools/call` - Call a tool with parameters
- `resources/list` - List available resources
- `resources/read` - Read a resource
- `prompts/list` - List available prompts
- `prompts/get` - Get a prompt with arguments
- `completion/complete` - Get argument completions

## Development

### Running the Gateway
```bash
npm install
npm start
```

### Building the Docker Image
```bash
docker build -t mcp-gateway .
```

### Environment Variables
- `PORT` - Server port (default: 8080)
- Plus all environment variables needed by the underlying MCP servers

## Files

- `server.js` - Main gateway server implementation
- `package.json` - Node.js dependencies and scripts
- `Dockerfile` - Container build configuration
- `README.md` - This documentation

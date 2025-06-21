# Custom MCP Development Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            VS Code MCP Configuration                            │
│                                .vscode/mcp.json                                 │
└─────────────────┬───────────────────────────────────────────────────────────────┘
                  │
                  │ HTTP requests
                  ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              MCP Gateway                                        │
│                          (localhost:8080)                                      │
│                                                                                 │
│  ┌───────────────┬───────────────┬─────────────────┬─────────────────────────┐  │
│  │  Static MCPs  │  Static MCPs  │   Static MCPs   │     Dynamic MCPs        │  │
│  │   context7    │   supabase    │    neo4j-*      │                         │  │
│  │     :3010     │    :3020      │     :3030-60    │                         │  │
│  └───────────────┴───────────────┴─────────────────┘                         │  │
│                                                      │                         │  │
│  Gateway Routes:                                     │                         │  │
│  /mcp/context7 ──────────────────────────────────────┼──> context7:3010       │  │
│  /mcp/supabase ──────────────────────────────────────┼──> supabase:3020       │  │
│  /mcp/neo4j-* ───────────────────────────────────────┼──> neo4j-*:3030-60     │  │
│  /mcp/dev/* ─────────────────────────────────────────┼──> dev-mcp:3200/*      │  │
│                                                      │                         │  │
└─────────────────────────────────────────────────────┼─────────────────────────┘  │
                                                       │                            │
                  Dynamic Service Discovery            │                            │
                  and Routing                          │                            │
                                                       ▼                            │
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            Dev MCP Service                                      │
│                          (localhost:3200)                                      │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    Service Discovery & Management                       │   │
│  │                                                                         │   │
│  │  • Scans /app/custom-mcps/ for MCP projects                           │   │
│  │  • Auto-installs dependencies (npm install)                           │   │
│  │  • Starts each service on unique ports (3100+)                        │   │
│  │  • Health monitoring & restart capabilities                           │   │
│  │  • HTTP proxy routes: /mcp/{service-name}                             │   │
│  │  • Gateway registration (auto-discovery)                              │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  Routes:                                                                        │
│  /health ─────────────────────────> Service Manager Health                     │
│  /services ───────────────────────> List Managed Services                      │
│  /mcp/hello-world ────────────────> Proxy to hello-world:3100                  │
│  /mcp/{custom-service} ───────────> Proxy to {custom-service}:310X             │
│                                                                                 │
└─────────────┬───────────────────────────────────────────────────────────────────┘
              │
              │ Manages & Proxies
              ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          Custom MCP Services                                   │
│                         (Dynamically Loaded)                                   │
│                                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                 │
│  │  hello-world    │  │  my-custom-mcp  │  │  another-mcp    │                 │
│  │    :3100        │  │    :3101        │  │    :3102        │                 │
│  │                 │  │                 │  │                 │                 │
│  │ MCP Tools:      │  │ MCP Tools:      │  │ MCP Tools:      │                 │
│  │ • greet         │  │ • custom_tool   │  │ • special_func  │                 │
│  │ • echo          │  │ • another_tool  │  │ • data_process  │                 │
│  │ • get_time      │  │                 │  │                 │                 │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                 │
│                                                                                 │
└─────────────┬───────────────────────────────────────────────────────────────────┘
              │
              │ File System
              ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        Custom MCPs Directory                                   │
│                      /sandbox/custom-mcps/                                     │
│                                                                                 │
│  hello-world/                                                                  │
│  ├── package.json                                                              │
│  ├── index.js                 ← MCP Server Implementation                      │
│  └── README.md                                                                 │
│                                                                                 │
│  my-custom-mcp/                                                                │
│  ├── package.json                                                              │
│  ├── index.js                                                                  │
│  └── ...                                                                       │
│                                                                                 │
│  shared/                       ← Common utilities & components                 │
│  ├── mcp-base.js                                                               │
│  ├── logger.js                                                                 │
│  └── utils.js                                                                  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Development Workflow

### 1. **Add New Custom MCP**
```bash
# Create new MCP service
mkdir sandbox/custom-mcps/my-new-mcp
cd sandbox/custom-mcps/my-new-mcp

# Initialize with package.json and index.js
npm init -y
# Implement MCP server using shared utilities

# Rebuild dev-mcp-service to pick up changes
cd ../../
docker-compose -f docker-compose.mcp-services.yml restart dev-mcp-service
```

### 2. **Hot Reload Development**
- The dev-mcp-service monitors `/app/custom-mcps/` directory
- File changes trigger automatic service restarts
- No need to rebuild containers for code changes
- Dependency changes require `docker-compose restart dev-mcp-service`

### 3. **Service Discovery Flow**
1. **Dev MCP Service** scans custom-mcps directory
2. **Auto-installation** of dependencies for each project
3. **Port allocation** (3100, 3101, 3102, ...)
4. **Health monitoring** with automatic restarts
5. **Gateway registration** for external access
6. **Proxy routing** through dev-mcp-service

### 4. **VS Code Integration**
```json
{
  "servers": {
    "dev-hello-world": {
      "type": "http", 
      "url": "http://localhost:8080/mcp/dev/hello-world"
    }
  }
}
```

## Benefits

✅ **Single Container**: One dev-mcp-service manages all custom MCPs  
✅ **No Docker Compose Changes**: Add services without modifying docker-compose.yml  
✅ **Auto-Discovery**: Services automatically registered with gateway  
✅ **Hot Reload**: Fast development cycle with file watching  
✅ **Shared Utilities**: Common MCP patterns in shared/ directory  
✅ **Port Management**: Automatic port allocation and conflict resolution  
✅ **Health Monitoring**: Automatic restart of failed services  
✅ **Isolated Dependencies**: Each service manages its own npm dependencies  

## Next Steps

1. 🔧 **Implement gateway registration** endpoint in mcp-gateway
2. 🔄 **Add file watching** for hot reload in dev-mcp-service  
3. 📁 **Create MCP templates** for rapid project scaffolding
4. 🧪 **Add testing framework** for custom MCP services
5. 📊 **Implement logging aggregation** for debugging

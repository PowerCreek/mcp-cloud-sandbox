# Custom MCP Development Environment

This directory provides a containerized environment for developing custom Model Context Protocol (MCP) servers with hot reload capabilities and automatic service discovery.

## 🚀 Quick Start

### 1. Start the Development Environment
```bash
cd sandbox
docker-compose -f docker-compose.mcp-services.yml up -d dev-mcp-service
```

### 2. Verify Services are Running
```bash
# Check dev-mcp-service health
docker exec dev-mcp-service curl -s http://localhost:3200/health

# Check hello-world service
docker exec dev-mcp-service curl -s http://localhost:3100/health

# List available tools
docker exec dev-mcp-service curl -s -X POST http://localhost:3100/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":"1","method":"tools/list"}'
```

### 3. Test MCP Tools
```bash
# Test the greet tool
docker exec dev-mcp-service curl -s -X POST http://localhost:3100/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":"2","method":"tools/call","params":{"name":"greet","arguments":{"name":"Developer","style":"enthusiastic"}}}'

# Test the time tool
docker exec dev-mcp-service curl -s -X POST http://localhost:3100/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":"3","method":"tools/call","params":{"name":"get_time","arguments":{"format":"human"}}}'
```

## 📁 Directory Structure

```
sandbox/
├── custom-mcps/           ← Your custom MCP projects go here
│   ├── hello-world/       ← Example MCP service
│   │   ├── package.json
│   │   ├── index.js       ← MCP server implementation
│   │   └── README.md
│   └── shared/           ← Common utilities
│       ├── mcp-base.js
│       ├── logger.js
│       └── utils.js
└── docker-compose.mcp-services.yml
```

## 🛠️ Creating a New Custom MCP

### 1. Create New Project Directory
```bash
mkdir sandbox/custom-mcps/my-awesome-mcp
cd sandbox/custom-mcps/my-awesome-mcp
```

### 2. Initialize Package
```bash
npm init -y
npm install @modelcontextprotocol/sdk express
```

### 3. Create MCP Server (index.js)
```javascript
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const express = require('express');

// Use the shared utilities
const { createMCPServer } = require('../shared/mcp-base.js');
const { logger } = require('../shared/logger.js');

const tools = [
  {
    name: "my_tool",
    description: "My awesome custom tool",
    inputSchema: {
      type: "object",
      properties: {
        input: {
          type: "string",
          description: "Input parameter"
        }
      },
      required: ["input"]
    }
  }
];

const toolHandlers = {
  my_tool: async (args) => {
    return {
      content: [{
        type: "text",
        text: `Hello from my tool with input: ${args.input}`
      }]
    };
  }
};

// Create and start the MCP server
createMCPServer('my-awesome-mcp', tools, toolHandlers);
```

### 4. Restart Dev Service
```bash
cd ../../
docker-compose -f docker-compose.mcp-services.yml restart dev-mcp-service
```

The dev-mcp-service will automatically:
- ✅ Detect your new service
- ✅ Install dependencies  
- ✅ Start it on a unique port
- ✅ Add health monitoring
- ✅ Register with the gateway

## 🔧 Development Workflow

### Hot Reload
- Edit files in `custom-mcps/your-service/`
- Changes trigger automatic service restart
- For dependency changes: `docker-compose restart dev-mcp-service`

### Debugging
```bash
# View all service logs
docker logs dev-mcp-service

# Check service health
docker exec dev-mcp-service curl -s http://localhost:3200/services

# Test specific service
docker exec dev-mcp-service curl -s http://localhost:310X/health
```

### VS Code Integration
Add to `.vscode/mcp.json`:
```json
{
  "servers": {
    "my-awesome-mcp": {
      "type": "http",
      "url": "http://localhost:8080/mcp/dev/my-awesome-mcp"
    }
  }
}
```

## 📋 Available Services

The hello-world example provides:

### Tools
- **greet**: Generate personalized greetings
- **echo**: Echo messages with formatting options  
- **get_time**: Get current time in various formats

### Usage Examples
```bash
# Greet tool
curl -X POST http://localhost:3100/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"greet","arguments":{"name":"Alice","style":"formal"}}}'

# Echo tool  
curl -X POST http://localhost:3100/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":"2","method":"tools/call","params":{"name":"echo","arguments":{"message":"Hello World","uppercase":true,"repeat":2}}}'

# Time tool
curl -X POST http://localhost:3100/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":"3","method":"tools/call","params":{"name":"get_time","arguments":{"format":"iso","timezone":"UTC"}}}'
```

## 🏗️ Architecture

See [CUSTOM_MCP_ARCHITECTURE.md](CUSTOM_MCP_ARCHITECTURE.md) for detailed architecture documentation.

## 🚨 Troubleshooting

### Service Not Starting
1. Check logs: `docker logs dev-mcp-service`
2. Verify package.json is valid
3. Ensure all dependencies are installed
4. Check for port conflicts

### Gateway Not Accessible
1. Make sure mcp-gateway container is running
2. Check Docker network connectivity
3. Verify port mappings in docker-compose.yml

### VS Code Not Connecting
1. Restart VS Code after adding new services
2. Check `.vscode/mcp.json` syntax
3. Ensure gateway registration is working

## 📚 Resources

- [MCP SDK Documentation](https://github.com/modelcontextprotocol/sdk)
- [Custom MCP Architecture](CUSTOM_MCP_ARCHITECTURE.md)
- [Docker Compose Reference](docker-compose.mcp-services.yml)

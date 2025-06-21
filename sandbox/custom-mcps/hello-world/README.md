# Hello World MCP Server

A simple demonstration MCP server for testing the custom development environment.

## Features

This server provides three basic tools to demonstrate MCP functionality:

### 🎯 Tools Available

1. **greet** - Generate personalized greetings
   - `name` (required): Person's name to greet
   - `style` (optional): greeting style (casual, formal, enthusiastic)

2. **echo** - Echo messages with formatting options
   - `message` (required): Message to echo
   - `uppercase` (optional): Convert to uppercase
   - `repeat` (optional): Repeat 1-5 times

3. **get_time** - Get current time in various formats
   - `format` (optional): iso, unix, or human format
   - `timezone` (optional): Specific timezone

## Usage Examples

### Direct API Testing

```bash
# Test tools list
curl -X POST http://localhost:3100 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":1}'

# Test greet tool
curl -X POST http://localhost:3100 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "method":"tools/call",
    "params":{
      "name":"greet",
      "arguments":{"name":"World","style":"enthusiastic"}
    },
    "id":2
  }'

# Test echo tool
curl -X POST http://localhost:3100 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "method":"tools/call",
    "params":{
      "name":"echo",
      "arguments":{"message":"Hello MCP!","uppercase":true,"repeat":3}
    },
    "id":3
  }'

# Test time tool
curl -X POST http://localhost:3100 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "method":"tools/call",
    "params":{
      "name":"get_time",
      "arguments":{"format":"human","timezone":"America/New_York"}
    },
    "id":4
  }'
```

### Via MCP Gateway (Development)

When running in the custom MCP development environment:

```bash
# Through the gateway (when dev-mcp-service is running)
curl -X POST http://localhost:8080/mcp/dev/hello-world \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":1}'
```

## Development

### Local Development
```bash
cd custom-mcps/hello-world
npm install
npm start
```

### Development with Watch Mode
```bash
npm run dev
```

## MCP Configuration

The server includes MCP-specific configuration in `package.json`:

```json
{
  "mcpServer": {
    "name": "hello-world",
    "description": "Simple greeting and demo tools",
    "capabilities": {
      "tools": true,
      "resources": false,
      "prompts": false
    },
    "defaultPort": 3100
  }
}
```

This configuration is used by the dev-mcp-service for automatic discovery and registration.

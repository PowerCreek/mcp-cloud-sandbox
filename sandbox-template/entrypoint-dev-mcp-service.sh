#!/bin/bash

echo "🔧 Starting Dev MCP Service Manager"
echo "================================="

# Change to dev-mcp-service directory
cd /app/dev-mcp-service

# Start the service manager
exec node index.js

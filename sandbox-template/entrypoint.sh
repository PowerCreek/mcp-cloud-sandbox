#!/bin/bash

echo "🚀 Starting MCP Service Container"
echo "================================="

# Check if MCP_COMMAND is set
if [[ -n "$MCP_COMMAND" ]]; then
    echo "🔧 Using custom command: $MCP_COMMAND"
    exec bash -c "$MCP_COMMAND"
else
    echo "🌉 Running default HTTP bridge mode"
    exec node mcp-http-bridge/index.js
fi

#!/bin/bash

echo "🔧 Testing External VS Code MCP Access"
echo "====================================="

echo "📋 Testing Context7 Initialize..."
curl -s -X POST http://localhost:8080/mcp/context7 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{"roots":{"listChanged":true},"sampling":{}},"clientInfo":{"name":"VS Code","version":"1.0.0"}},"id":1}' \
  | head -c 200

echo -e "\n\n📋 Testing Context7 Tools List..."
curl -s -X POST http://localhost:8080/mcp/context7 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":2}' \
  | head -c 200

echo -e "\n\n✅ External access test complete!"

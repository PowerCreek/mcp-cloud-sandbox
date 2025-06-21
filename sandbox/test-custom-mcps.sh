#!/bin/bash

# Test script for Custom MCP Development Environment

echo "🧪 Testing Custom MCP Development Environment"
echo "============================================="

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 5

# Test 1: Check dev-mcp-service health
echo ""
echo "📊 1. Checking dev-mcp-service health:"
curl -s http://localhost:3200/health | jq '.'

# Test 2: List managed custom services
echo ""
echo "📋 2. List managed custom services:"
curl -s http://localhost:3200/services | jq '.'

# Test 3: Test hello-world service directly
echo ""
echo "🛠️ 3. Testing hello-world service tools/list (direct):"
curl -X POST http://localhost:3100/health 2>/dev/null | jq '.' || echo "Service not yet available"

# Test 4: Test hello-world through dev service proxy
echo ""
echo "🔄 4. Testing hello-world through dev service proxy:"
curl -X POST http://localhost:3200/dev/hello-world \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":1}' | jq '.'

# Test 5: Test hello-world initialization through gateway
echo ""
echo "🚀 5. Testing hello-world initialization through gateway:"
curl -X POST http://localhost:8080/mcp/dev/hello-world \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "method":"initialize",
    "params":{
      "protocolVersion":"2024-11-05",
      "clientInfo":{"name":"test","version":"1.0.0"}
    },
    "id":2
  }' | jq '.'

# Test 6: Test greet tool through gateway
echo ""
echo "🎯 6. Testing greet tool through gateway:"
curl -X POST http://localhost:8080/mcp/dev/hello-world \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "method":"tools/call",
    "params":{
      "name":"greet",
      "arguments":{"name":"Custom MCP Developer","style":"enthusiastic"}
    },
    "id":3
  }' | jq '.'

# Test 7: Test echo tool through gateway
echo ""
echo "📢 7. Testing echo tool through gateway:"
curl -X POST http://localhost:8080/mcp/dev/hello-world \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "method":"tools/call",
    "params":{
      "name":"echo",
      "arguments":{"message":"Custom MCP Development is working!","uppercase":true,"repeat":2}
    },
    "id":4
  }' | jq '.'

# Test 8: Test time tool through gateway
echo ""
echo "⏰ 8. Testing get_time tool through gateway:"
curl -X POST http://localhost:8080/mcp/dev/hello-world \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "method":"tools/call",
    "params":{
      "name":"get_time",
      "arguments":{"format":"human","timezone":"UTC"}
    },
    "id":5
  }' | jq '.'

# Test 9: Check gateway discovery stats
echo ""
echo "📈 9. Gateway discovery statistics:"
curl -s http://localhost:8080/discovery/stats | jq '.'

# Test 10: List all services in gateway
echo ""
echo "🔍 10. All services registered with gateway:"
curl -s http://localhost:8080/health | jq '.services'

echo ""
echo "✅ Custom MCP development environment testing completed!"
echo ""
echo "🎯 Next steps:"
echo "   1. Add VS Code configuration for dev/hello-world"
echo "   2. Create additional custom MCP servers in custom-mcps/"
echo "   3. Test hot reload by modifying hello-world/index.js"
echo "   4. Check dev-mcp-service logs: docker logs dev-mcp-service"

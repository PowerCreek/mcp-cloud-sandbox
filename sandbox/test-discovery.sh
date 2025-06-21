#!/bin/bash

# Test script for MCP Gateway Discovery System

echo "🧪 Testing MCP Gateway Discovery System"
echo "======================================"

# Wait for gateway to be ready
echo "⏳ Waiting for gateway to be ready..."
sleep 3

# Test 1: Check gateway health and discovery stats
echo ""
echo "📊 1. Checking gateway health and stats:"
curl -s http://localhost:8080/health | jq '.'

echo ""
echo "📈 2. Discovery statistics:"
curl -s http://localhost:8080/discovery/stats | jq '.'

# Test 2: Check current services
echo ""
echo "🔍 3. Current registered services:"
curl -s http://localhost:8080/discovery/services | jq '.'

# Test 3: Manually register sequential-thinking-v2
echo ""
echo "📝 4. Registering sequential-thinking-v2 dynamically:"
curl -X POST http://localhost:8080/discovery/register \
  -H "Content-Type: application/json" \
  -d '{
    "serviceName": "sequential-thinking-v2",
    "serviceConfig": {
      "url": "http://sequential-thinking-service:3006",
      "description": "Sequential thinking v2 (dynamically registered via API)",
      "capabilities": {
        "tools": true,
        "resources": false,
        "prompts": false
      }
    }
  }' | jq '.'

# Test 4: Check updated stats
echo ""
echo "📈 5. Updated discovery statistics:"
curl -s http://localhost:8080/discovery/stats | jq '.'

# Test 5: Test sequential-thinking-v2 tool discovery
echo ""
echo "🛠️ 6. Testing sequential-thinking-v2 tools/list:"
curl -X POST http://localhost:8080/mcp/sequential-thinking-v2 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":1}' | jq '.'

# Test 6: Test sequential-thinking-v2 initialization
echo ""
echo "🚀 7. Testing sequential-thinking-v2 initialization:"
curl -X POST http://localhost:8080/mcp/sequential-thinking-v2 \
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

# Test 7: Compare with original sequential-thinking service
echo ""
echo "🔄 8. Comparing with original sequential-thinking service:"
curl -X POST http://localhost:8080/mcp/sequential-thinking \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":3}' | jq '.'

# Test 8: Health check all services
echo ""
echo "💓 9. Health check all services:"
curl -s http://localhost:8080/discovery/health | jq '.'

# Test 9: Test a tool call on sequential-thinking-v2
echo ""
echo "🔧 10. Testing tool call on sequential-thinking-v2:"
curl -X POST http://localhost:8080/mcp/sequential-thinking-v2 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "method":"tools/call",
    "params":{
      "name":"sequentialthinking",
      "arguments":{
        "thought":"Testing dynamic service discovery: How does dynamic registration improve system flexibility?",
        "nextThoughtNeeded":false,
        "thoughtNumber":1,
        "totalThoughts":1
      }
    },
    "id":4
  }' | jq '.'

echo ""
echo "✅ Discovery system testing completed!"
echo "🔍 Check the gateway logs for detailed event logging"

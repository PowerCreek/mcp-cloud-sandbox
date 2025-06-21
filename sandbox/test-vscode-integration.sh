#!/bin/bash

echo "🎯 VS Code MCP Integration - Complete Workflow Test"
echo "=================================================="
echo

echo "📊 Step 1: Health Check"
echo "----------------------"
curl -s http://localhost:8080/health | json_pp | head -15
echo

echo "📋 Step 2: Service Discovery"  
echo "----------------------------"
curl -s http://localhost:8080/services | json_pp
echo

echo "🔧 Step 3: VS Code MCP Protocol Test"
echo "------------------------------------"

echo "   Context7 - Initialize:"
INIT_RESPONSE=$(curl -s -X POST http://localhost:8080/mcp/context7 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{"roots":{"listChanged":true},"sampling":{}},"clientInfo":{"name":"VS Code","version":"1.0.0"}},"id":1}')

if echo "$INIT_RESPONSE" | grep -q '"serverInfo"'; then
    echo "   ✅ Initialize successful"
else
    echo "   ❌ Initialize failed"
    echo "   Response: $INIT_RESPONSE"
fi

echo
echo "   Context7 - List Tools:"
TOOLS_RESPONSE=$(curl -s -X POST http://localhost:8080/mcp/context7 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":2}')

TOOL_COUNT=$(echo "$TOOLS_RESPONSE" | grep -o '"name"' | wc -l)
echo "   ✅ Found $TOOL_COUNT tools available"

echo
echo "   Context7 - Test Tool Call:"
CALL_RESPONSE=$(curl -s -X POST http://localhost:8080/mcp/context7 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"resolve-library-id","arguments":{"libraryName":"react"}},"id":3}')

if echo "$CALL_RESPONSE" | grep -q '"result"'; then
    echo "   ✅ Tool call successful"
else
    echo "   ❌ Tool call failed"
fi

echo
echo "🎉 VS Code MCP Integration Test Complete!"
echo "========================================="
echo
echo "📝 Ready for VS Code! Use this configuration:"
echo 
echo '{
    "servers": {
        "context7": {
            "type": "http",
            "url": "http://localhost:8080/mcp/context7"
        },
        "supabase": {
            "type": "http",
            "url": "http://localhost:8080/mcp/supabase"
        }
    }
}'
echo

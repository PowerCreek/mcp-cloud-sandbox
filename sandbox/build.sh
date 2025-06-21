#!/bin/bash
set -e

echo "🔧 Building MCP Gateway for Sandboxed Environment..."

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SANDBOX_DIR="$SCRIPT_DIR"
TEMPLATE_DIR="$(dirname "$SCRIPT_DIR")/sandbox-template"

echo "📍 Script directory: $SCRIPT_DIR"
echo "📍 Template directory: $TEMPLATE_DIR"

# Check if we have the required files
if [ ! -f "$SANDBOX_DIR/docker-compose.yml" ]; then
    echo "❌ Error: docker-compose.yml not found in $SANDBOX_DIR"
    exit 1
fi

if [ ! -d "$TEMPLATE_DIR" ]; then
    echo "❌ Error: sandbox-template directory not found at $TEMPLATE_DIR"
    exit 1
fi

# Build the gateway image
echo "📦 Building MCP Gateway Docker image..."
cd "$TEMPLATE_DIR"
docker build -t mcp-gateway .

# Build the main sandbox image  
echo "📦 Building Agentic Sandbox Docker image..."
cd "$SANDBOX_DIR"
docker-compose build

echo "✅ Build complete!"
echo ""
echo "🚀 To start the sandbox environment, run:"
echo "   docker-compose up -d"
echo ""
echo "🔍 To check status:"
echo "   docker-compose ps"
echo ""
echo "📊 Gateway health check:"
echo "   curl http://localhost:8080/health"
echo ""
echo "📋 List available MCP services:"
echo "   curl http://localhost:8080/services"

#!/bin/bash
# Build and run the MCP HTTP bridge service using the dedicated Dockerfile and docker-compose for MCP services

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT/sandbox"

echo "[mcp-bridge] Building MCP HTTP bridge service using Dockerfile.mcp-service and docker-compose.mcp-services.yml..."

docker compose -f docker-compose.mcp-services.yml build --build-arg DOCKERFILE=Dockerfile.mcp-service

echo "[mcp-bridge] To start the service, run:"
echo "docker compose -f docker-compose.mcp-services.yml up"
echo "[mcp-bridge] Starting the MCP HTTP bridge service..."
docker compose -f docker-compose.mcp-services.yml up

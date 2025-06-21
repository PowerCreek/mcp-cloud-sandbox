#!/bin/bash
# Script to run Neo4j Aura MCP server with environment variables

# Load environment variables from .env file
if [ -f .env ]; then
    source .env
fi

# Check if required variables are set
if [ -z "$CLIENT_ID" ] || [ -z "$CLIENT_SECRET" ]; then
    echo "Error: CLIENT_ID and CLIENT_SECRET must be set in environment or .env file" >&2
    exit 1
fi

# Run the Docker container with the environment variables
exec docker run --rm --interactive \
    --entrypoint mcp-neo4j-aura-manager \
    mcp-neo4j-aura-manager:0.2.2 \
    --client-id "$CLIENT_ID" \
    --client-secret "$CLIENT_SECRET"

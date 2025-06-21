#!/bin/bash
# Entrypoint for Neo4j Aura MCP service

# Load environment variables from .env file if it exists
if [ -f .env ]; then
    source .env
fi

# Check if required variables are set
if [ -z "$NEO4J_AURA_INSTANCE_ID" ] || [ -z "$NEO4J_AURA_INSTANCE_USERNAME" ] || [ -z "$NEO4J_AURA_INSTANCE_PASSWORD" ]; then
    echo "Error: NEO4J_AURA_INSTANCE_ID, NEO4J_AURA_INSTANCE_USERNAME, and NEO4J_AURA_INSTANCE_PASSWORD must be set in environment" >&2
    exit 1
fi

# Run the Neo4j Aura MCP server directly
exec docker run --rm --interactive \
    -e "NEO4J_AURA_INSTANCE_ID=$NEO4J_AURA_INSTANCE_ID" \
    -e "NEO4J_AURA_INSTANCE_USERNAME=$NEO4J_AURA_INSTANCE_USERNAME" \
    -e "NEO4J_AURA_INSTANCE_PASSWORD=$NEO4J_AURA_INSTANCE_PASSWORD" \
    mcp/neo4j-aura:latest

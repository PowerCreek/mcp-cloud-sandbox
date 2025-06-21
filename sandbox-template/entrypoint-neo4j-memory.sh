#!/bin/bash
# Entrypoint for Neo4j Memory MCP service

# Load environment variables from .env file if it exists
if [ -f .env ]; then
    source .env
fi

# Check if required variables are set
if [ -z "$NEO4J_URL" ] || [ -z "$NEO4J_USERNAME" ] || [ -z "$NEO4J_PASSWORD" ]; then
    echo "Error: NEO4J_URL, NEO4J_USERNAME, and NEO4J_PASSWORD must be set in environment" >&2
    exit 1
fi

# Run the Neo4j Memory MCP server directly
exec docker run --rm --interactive \
    -e "NEO4J_URL=$NEO4J_URL" \
    -e "NEO4J_USERNAME=$NEO4J_USERNAME" \
    -e "NEO4J_PASSWORD=$NEO4J_PASSWORD" \
    mcp/neo4j-memory:latest

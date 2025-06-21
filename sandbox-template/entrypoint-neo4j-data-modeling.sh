#!/bin/bash
# Entrypoint for Neo4j Data Modeling MCP service

# Load environment variables from .env file if it exists
if [ -f .env ]; then
    source .env
fi

# Run the Neo4j Data Modeling MCP server directly
exec docker run --rm --interactive mcp/neo4j-data-modeling:latest

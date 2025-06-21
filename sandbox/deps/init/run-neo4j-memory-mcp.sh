#!/bin/bash
# Script to run Neo4j Memory MCP server with environment variables

# Load environment variables from .env file
if [ -f .env ]; then
    source .env
fi

# Check if required variables are set
if [ -z "$NEO4J_URI" ] || [ -z "$NEO4J_USERNAME" ] || [ -z "$NEO4J_PASSWORD" ]; then
    echo "Error: NEO4J_URI, NEO4J_USERNAME, and NEO4J_PASSWORD must be set in environment or .env file" >&2
    exit 1
fi

# Run the Docker container with the environment variables
exec docker run --rm --interactive \
    -e "NEO4J_URL=$NEO4J_URI" \
    -e "NEO4J_USERNAME=$NEO4J_USERNAME" \
    -e "NEO4J_PASSWORD=$NEO4J_PASSWORD" \
    mcp/neo4j-memory:latest

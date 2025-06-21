#!/bin/bash
# Script to run Sequential Thinking MCP server

# Run the Docker container
exec docker run --rm --interactive \
    mcp/sequentialthinking:latest

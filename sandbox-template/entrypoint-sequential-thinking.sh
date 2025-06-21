#!/bin/bash
# Entrypoint for Sequential Thinking MCP service

# Run the sequential thinking MCP service
exec docker run --rm --interactive mcp/sequentialthinking:latest

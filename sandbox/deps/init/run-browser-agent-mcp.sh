#!/bin/bash
# Browser-Agent MCP Server Launcher
# Runs the browser automation MCP server for VS Code integration

# Set up environment
export NODE_ENV=production

# Ensure we're in the right directory
cd "$(dirname "$0")/../.."

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed or not in PATH" >&2
    exit 1
fi

# Check if the browser agent MCP server exists
SCRIPT_PATH="services/production/browser_agent_mcp_server.js"
if [ ! -f "$SCRIPT_PATH" ]; then
    echo "Error: $SCRIPT_PATH not found in $(pwd)" >&2
    echo "Looking for file at: $(pwd)/$SCRIPT_PATH" >&2
    ls -la services/production/ >&2
    exit 1
fi

# Load environment variables if .env exists
if [ -f .env ]; then
    source .env
fi

# Provide default values for Supabase if not set
if [ -z "$SUPABASE_URL" ]; then
    export SUPABASE_URL="https://your-project.supabase.co"
fi

if [ -z "$SUPABASE_ANON_KEY" ]; then
    export SUPABASE_ANON_KEY="your-anon-key"
fi

# Log startup
echo "Starting Browser-Agent MCP Server..." >&2
echo "Supabase URL: $SUPABASE_URL" >&2
echo "Working directory: $(pwd)" >&2
echo "Script path: $SCRIPT_PATH" >&2

# Execute the MCP server
exec node "$SCRIPT_PATH"

#!/bin/bash
# Script to run Supabase MCP server with environment variables

# Load environment variables from .env file
if [ -f .env ]; then
    source .env
fi

# Check if required variables are set
if [ -z "$SUPABASE_AGENT_OI_PROJ_ID" ] || [ -z "$SUPABASE_PAT" ]; then
    echo "Error: SUPABASE_AGENT_OI_PROJ_ID and SUPABASE_PAT must be set in environment or .env file" >&2
    exit 1
fi

# Run using npx (the original working approach)
exec npx -y @supabase/mcp-server-supabase@latest \
    --project-ref="$SUPABASE_AGENT_OI_PROJ_ID" \
    --access-token="$SUPABASE_PAT"

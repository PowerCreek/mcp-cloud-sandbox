#!/bin/bash
# Entrypoint for Supabase MCP service

# Load environment variables from .env file if it exists
if [ -f .env ]; then
    source .env
fi

# Check if required variables are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set in environment" >&2
    exit 1
fi

# Run the Supabase MCP server directly
exec docker run --rm --interactive \
    -e "SUPABASE_URL=$SUPABASE_URL" \
    -e "SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY" \
    -e "SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY" \
    mcp/supabase:latest

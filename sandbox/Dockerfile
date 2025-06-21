# Agentic AI Development Sandbox Dockerfile
FROM ubuntu:22.04

# Install core dependencies
RUN apt-get update && apt-get install -y \
    curl git python3 python3-pip nodejs npm docker.io \
    && rm -rf /var/lib/apt/lists/*

# Install MCP tools (Node.js global)
RUN npm install -g @upstash/context7-mcp @supabase/mcp-server-supabase

# Set up workspace
WORKDIR /workspace

# Copy entrypoint script (optional, for cloud init)
# COPY entrypoint.sh /entrypoint.sh
# RUN chmod +x /entrypoint.sh

# Expose default dev port
EXPOSE 3000

# Default command (can be overridden by compose)
CMD ["bash"]

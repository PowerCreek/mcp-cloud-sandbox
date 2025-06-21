FROM node:20-alpine

WORKDIR /app

# Install system dependencies that might be needed for MCP servers
RUN apk add --no-cache \
    bash \
    curl \
    git \
    python3 \
    py3-pip \
    docker-cli

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy application code
COPY . .

# Make scripts executable and create symlink for init scripts
RUN chmod +x ./deps/init/*.sh && \
    ln -s /app/deps/init /app/init

# Expose the gateway port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Start the gateway server
CMD ["npm", "start"]

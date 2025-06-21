import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.PORT || 8080;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Store active MCP clients for each service
const mcpClients = new Map();

// MCP service configurations - these map to containerized MCP services
const MCP_SERVICES = {
    'context7': {
        command: 'npx',
        args: ['-y', '@upstash/context7-mcp'],
        cwd: '/app'
    },
    'supabase': {
        type: 'http',
        url: 'http://supabase-service:3005'
    },
    'sequential-thinking': {
        type: 'http',
        url: 'http://sequential-thinking-service:3006'
    },
    'neo4j-aura': {
        type: 'http',
        url: 'http://neo4j-aura-service:3004'
    },
    'neo4j-cypher': {
        type: 'http',
        url: 'http://neo4j-cypher-service:3002'
    },
    'neo4j-data-modeling': {
        type: 'http',
        url: 'http://neo4j-data-modeling-service:3003'
    },
    'neo4j-memory': {
        type: 'http',
        url: 'http://neo4j-memory-service:3001'
    }
};

// Initialize MCP client for a service
async function initializeMcpClient(serviceName) {
    if (mcpClients.has(serviceName)) {
        return mcpClients.get(serviceName);
    }

    const config = MCP_SERVICES[serviceName];
    if (!config) {
        throw new Error(`Unknown MCP service: ${serviceName}`);
    }

    try {
        console.log(`Initializing MCP client for ${serviceName}...`);

        // Handle HTTP-based services
        if (config.type === 'http') {
            const httpClient = {
                url: config.url,
                async request(method, params, id) {
                    const response = await fetch(config.url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            jsonrpc: '2.0',
                            method,
                            params,
                            id
                        })
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }

                    const result = await response.json();
                    if (result.error) {
                        throw new Error(`MCP error ${result.error.code}: ${result.error.message}`);
                    }
                    return result.result;
                },
                async listTools() {
                    return this.request('tools/list', {}, Math.random());
                },
                async callTool(params) {
                    return this.request('tools/call', params, Math.random());
                },
                async listResources() {
                    return this.request('resources/list', {}, Math.random());
                },
                async readResource(params) {
                    return this.request('resources/read', params, Math.random());
                },
                async listPrompts() {
                    return this.request('prompts/list', {}, Math.random());
                },
                async getPrompt(params) {
                    return this.request('prompts/get', params, Math.random());
                },
                async complete(params) {
                    return this.request('completion/complete', params, Math.random());
                },
                async close() {
                    // HTTP clients don't need explicit closing
                }
            };

            mcpClients.set(serviceName, httpClient);
            console.log(`✓ HTTP MCP client for ${serviceName} initialized successfully`);
            return httpClient;
        }

        // Handle stdio-based services (existing logic)
        const transport = new StdioClientTransport({
            command: config.command,
            args: config.args || [],
            env: { ...process.env, ...config.env },
            cwd: config.cwd
        });

        // Create client
        const client = new Client({
            name: `mcp-gateway-${serviceName}`,
            version: "1.0.0"
        });

        // Connect to the MCP server
        await client.connect(transport);

        mcpClients.set(serviceName, client);
        console.log(`✓ Stdio MCP client for ${serviceName} initialized successfully`);

        return client;
    } catch (error) {
        console.error(`Failed to initialize MCP client for ${serviceName}:`, error);
        throw error;
    }
}

// Store initialization state for each service
const initializedServices = new Map();

// Generic MCP proxy handler
async function handleMcpRequest(req, res) {
    const serviceName = req.params.service;

    if (!MCP_SERVICES[serviceName]) {
        return res.status(404).json({
            jsonrpc: '2.0',
            error: {
                code: -32000,
                message: `Unknown MCP service: ${serviceName}`
            },
            id: null
        });
    }

    try {
        const { method, params, id } = req.body;

        // Handle MCP protocol initialization sequence
        if (method === 'initialize') {
            // Get or create MCP client for this service
            const client = await initializeMcpClient(serviceName);

            // Get server capabilities from the underlying MCP server
            const serverInfo = {
                name: `mcp-gateway-${serviceName}`,
                version: "1.0.0"
            };

            // Try to get actual capabilities from the server
            let capabilities = {};
            try {
                const toolsResult = await client.listTools();
                if (toolsResult.tools) {
                    capabilities.tools = {};
                }
            } catch (e) {
                // Ignore - server might not support tools
            }

            try {
                const resourcesResult = await client.listResources();
                if (resourcesResult.resources) {
                    capabilities.resources = {};
                }
            } catch (e) {
                // Ignore - server might not support resources
            }

            try {
                const promptsResult = await client.listPrompts();
                if (promptsResult.prompts) {
                    capabilities.prompts = {};
                }
            } catch (e) {
                // Ignore - server might not support prompts
            }

            // Mark service as initialized
            initializedServices.set(serviceName, {
                protocolVersion: params.protocolVersion || '2024-11-05',
                clientInfo: params.clientInfo
            });

            return res.json({
                jsonrpc: '2.0',
                result: {
                    protocolVersion: '2024-11-05',
                    capabilities: capabilities,
                    serverInfo: serverInfo
                },
                id: id || null
            });
        }

        // Handle initialized notification (fire-and-forget)
        if (method === 'notifications/initialized') {
            // This is a notification, no response needed
            return res.status(200).end();
        }

        // For all other methods, ensure the service is initialized
        if (!initializedServices.has(serviceName)) {
            return res.status(400).json({
                jsonrpc: '2.0',
                error: {
                    code: -32002,
                    message: 'Server not initialized. Call initialize first.'
                },
                id: id || null
            });
        }

        // Get the initialized MCP client
        const client = mcpClients.get(serviceName);
        if (!client) {
            throw new Error(`MCP client not found for service: ${serviceName}`);
        }

        // Forward the request to the appropriate MCP method
        let result;
        switch (method) {
            case 'tools/list':
                result = await client.listTools();
                break;
            case 'tools/call':
                result = await client.callTool(params);
                break;
            case 'resources/list':
                result = await client.listResources();
                break;
            case 'resources/read':
                result = await client.readResource(params);
                break;
            case 'prompts/list':
                result = await client.listPrompts();
                break;
            case 'prompts/get':
                result = await client.getPrompt(params);
                break;
            case 'completion/complete':
                result = await client.complete(params);
                break;
            default:
                return res.status(400).json({
                    jsonrpc: '2.0',
                    error: {
                        code: -32601,
                        message: `Method not found: ${method}`
                    },
                    id: id || null
                });
        }

        res.json({
            jsonrpc: '2.0',
            result: result,
            id: id || null
        });

    } catch (error) {
        console.error(`Error handling MCP request for ${serviceName}:`, error);
        res.status(500).json({
            jsonrpc: '2.0',
            error: {
                code: -32603,
                message: error.message || 'Internal server error'
            },
            id: req.body.id || null
        });
    }
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: Object.keys(MCP_SERVICES),
        activeClients: Array.from(mcpClients.keys()),
        initializedServices: Array.from(initializedServices.keys())
    });
});

// List available services
app.get('/services', (req, res) => {
    res.json({
        services: Object.keys(MCP_SERVICES).map(name => ({
            name,
            endpoint: `/mcp/${name}`,
            status: mcpClients.has(name) ? 'connected' : 'not-connected'
        }))
    });
});

// MCP service endpoints - handle all HTTP methods for MCP protocol
app.all('/mcp/:service', handleMcpRequest);

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('Shutting down MCP gateway...');

    // Close all MCP clients
    for (const [serviceName, client] of mcpClients) {
        try {
            await client.close();
            console.log(`✓ Closed MCP client for ${serviceName}`);
        } catch (error) {
            console.error(`Error closing MCP client for ${serviceName}:`, error);
        }
    }

    process.exit(0);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 MCP Gateway server running on port ${PORT}`);
    console.log(`📋 Available services: ${Object.keys(MCP_SERVICES).join(', ')}`);
    console.log(`🔗 Service endpoints: http://localhost:${PORT}/mcp/{service-name}`);
    console.log(`💓 Health check: http://localhost:${PORT}/health`);
});

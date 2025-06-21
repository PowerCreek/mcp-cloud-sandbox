import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const app = express();
const PORT = process.env.MCP_HTTP_PORT || 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

let mcpClient = null;
let isInitialized = false;

// Initialize MCP client
async function initializeMcpClient() {
    if (mcpClient) {
        return mcpClient;
    }

    try {
        console.log('Initializing MCP client...');

        // Create transport with stdio using the entrypoint script
        const transport = new StdioClientTransport({
            command: process.env.MCP_COMMAND || './entrypoint.sh',
            args: process.env.MCP_ARGS ? process.env.MCP_ARGS.split(' ') : [],
            env: process.env,
            cwd: '/app'
        });

        // Create client
        const client = new Client({
            name: 'mcp-http-bridge',
            version: "1.0.0"
        });

        // Connect to the MCP server
        await client.connect(transport);

        mcpClient = client;
        isInitialized = true;
        console.log('✓ MCP client initialized successfully');

        return client;
    } catch (error) {
        console.error('Failed to initialize MCP client:', error);
        throw error;
    }
}

// Generic MCP request handler
async function handleMcpRequest(req, res) {
    try {
        const { method, params, id } = req.body;

        // Initialize client if not already done
        if (!isInitialized) {
            await initializeMcpClient();
        }

        // Handle MCP protocol methods
        let result;
        switch (method) {
            case 'initialize':
                // Return server capabilities
                result = {
                    protocolVersion: '2024-11-05',
                    capabilities: {},
                    serverInfo: {
                        name: 'mcp-http-bridge',
                        version: '1.0.0'
                    }
                };
                break;
            case 'tools/list':
                result = await mcpClient.listTools();
                break;
            case 'tools/call':
                result = await mcpClient.callTool(params);
                break;
            case 'resources/list':
                result = await mcpClient.listResources();
                break;
            case 'resources/read':
                result = await mcpClient.readResource(params);
                break;
            case 'prompts/list':
                result = await mcpClient.listPrompts();
                break;
            case 'prompts/get':
                result = await mcpClient.getPrompt(params);
                break;
            case 'completion/complete':
                result = await mcpClient.complete(params);
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
        console.error('Error handling MCP request:', error);
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
        initialized: isInitialized
    });
});

// MCP endpoint - handle all HTTP methods for MCP protocol
app.all('/', handleMcpRequest);
app.all('/mcp', handleMcpRequest);

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('Shutting down MCP HTTP bridge...');
    if (mcpClient) {
        try {
            await mcpClient.close();
            console.log('✓ Closed MCP client');
        } catch (error) {
            console.error('Error closing MCP client:', error);
        }
    }
    process.exit(0);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 MCP HTTP bridge running on port ${PORT}`);
    console.log(`💓 Health check: http://localhost:${PORT}/health`);
});

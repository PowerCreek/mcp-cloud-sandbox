import express from 'express';
import cors from 'cors';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { eventBus } from './eventBus.js';

const app = express();
const PORT = process.env.MCP_HTTP_PORT || 3000;

app.use(cors());
app.use(express.json());

let mcpClient = null;
let isInitialized = false;

// Initialize MCP client
async function initializeMcpClient() {
    if (mcpClient) return mcpClient;
    try {
        console.log('Initializing MCP client...');
        const transport = new StdioClientTransport({
            command: process.env.MCP_COMMAND || './entrypoint.sh',
            args: process.env.MCP_ARGS ? process.env.MCP_ARGS.split(' ') : [],
            env: process.env,
            cwd: '/app'
        });
        const client = new Client({ name: 'mcp-http-bridge', version: '1.0.0' });
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

// Route MCP requests through the event bus
eventBus.on('route', async ({ req, res }) => {
    const { method, params, id } = req.body;
    console.log(`[eventBus] Routing request for method: ${method}`);
    try {
        if (!isInitialized) await initializeMcpClient();
        let result;
        switch (method) {
            case 'initialize':
                result = {
                    protocolVersion: '2024-11-05',
                    capabilities: {},
                    serverInfo: { name: 'mcp-http-bridge', version: '1.0.0' }
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
                eventBus.emit('error', { method, params, id, error: 'Method not found' });
                return res.status(400).json({
                    jsonrpc: '2.0',
                    error: { code: -32601, message: `Method not found: ${method}` },
                    id: id || null
                });
        }
        eventBus.emit('response', { method, params, id, result });
        res.json({ jsonrpc: '2.0', result, id: id || null });
    } catch (error) {
        eventBus.emit('error', { error, req });
        console.error('Error handling MCP request:', error);
        res.status(500).json({
            jsonrpc: '2.0',
            error: { code: -32603, message: error.message || 'Internal server error' },
            id: req.body.id || null
        });
    }
});

// Generic MCP request handler: emit route event
function handleMcpRequest(req, res) {
    eventBus.emit('route', { req, res });
}

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString(), initialized: isInitialized });
});

app.all('/', handleMcpRequest);
app.all('/mcp', handleMcpRequest);

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

const { logger } = require('./logger.js');

// Simple MCP server creation utility
function createMCPServer(serviceName, tools, toolHandlers) {
    const express = require('express');
    const app = express();
    const port = process.env.PORT || 3100;

    app.use(express.json());

    // Health check endpoint
    app.get('/health', (req, res) => {
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            server: `${serviceName}-mcp`,
            version: '1.0.0'
        });
    });

    // MCP JSON-RPC endpoint
    app.post('/', async (req, res) => {
        const { jsonrpc, method, params, id } = req.body;

        logger.debug(`Received request: ${method}`, { id, params });

        try {
            let result;

            switch (method) {
                case 'initialize':
                    result = {
                        protocolVersion: '2024-11-05',
                        capabilities: { tools: {} },
                        serverInfo: { name: `${serviceName}-mcp`, version: '1.0.0' }
                    };
                    break;

                case 'tools/list':
                    logger.info('Tools list requested');
                    result = { tools };
                    break;

                case 'tools/call':
                    const { name, arguments: args } = params;
                    logger.info(`Tool call: ${name}`, args);

                    if (!toolHandlers[name]) {
                        throw new Error(`Unknown tool: ${name}`);
                    }

                    result = await toolHandlers[name](args);
                    break;

                default:
                    throw new Error(`Unknown method: ${method}`);
            }

            res.json({ jsonrpc: '2.0', result, id });
        } catch (error) {
            logger.error(`Error handling ${method}:`, error.message);
            res.status(500).json({
                jsonrpc: '2.0',
                error: { code: -32603, message: error.message },
                id
            });
        }
    });

    app.listen(port, () => {
        logger.info(`🚀 ${serviceName} MCP Server started on port ${port}`);
        logger.info(`📋 Available tools: ${tools.map(t => t.name).join(', ')}`);
        logger.info(`💓 Health check: http://localhost:${port}/health`);
    });
}

module.exports = { createMCPServer };

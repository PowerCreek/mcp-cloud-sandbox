import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { eventBus } from './eventBus.js';

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// MCP service configurations
const MCP_SERVICES = {
    'context7': {
        type: 'http',
        url: 'http://context7-service:3000'
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

app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(), 
        services: Object.keys(MCP_SERVICES) 
    });
});

// Pure proxy for MCP services
app.all('/mcp/:service', async (req, res) => {
    const serviceName = req.params.service;
    const { method, params, id } = req.body;
    
    eventBus.emit('route', { serviceName, method, params, id });
    
    try {
        const config = MCP_SERVICES[serviceName];
        if (!config) {
            eventBus.emit('error', { serviceName, error: 'Unknown MCP service' });
            return res.status(404).json({ 
                jsonrpc: '2.0', 
                error: { code: -32000, message: `Unknown MCP service: ${serviceName}` }, 
                id: id || null 
            });
        }

        // Handle notifications specially - they should not have responses
        if (method && method.startsWith('notifications/')) {
            eventBus.emit('notification', { serviceName, method, params });
            // Notifications should return 200 OK with no body
            return res.status(200).end();
        }

        // For initialize method, we need to get actual capabilities from the service
        if (method === 'initialize') {
            eventBus.emit('initialize-start', { serviceName, params });
            
            // First initialize the underlying service
            const initResponse = await fetch(config.url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jsonrpc: '2.0', method, params, id })
            });
            
            if (!initResponse.ok) {
                throw new Error(`HTTP ${initResponse.status}: ${initResponse.statusText}`);
            }
            
            const initResult = await initResponse.json();
            
            // Now get the actual tools list to populate capabilities
            const toolsResponse = await fetch(config.url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jsonrpc: '2.0', method: 'tools/list', params: {}, id: 'tools-list' })
            });
            
            let tools = [];
            if (toolsResponse.ok) {
                const toolsResult = await toolsResponse.json();
                if (toolsResult.result && toolsResult.result.tools) {
                    tools = toolsResult.result.tools;
                }
            }
            
            // Check for resources and prompts too
            let hasResources = false;
            let hasPrompts = false;
            
            try {
                const resourcesResponse = await fetch(config.url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ jsonrpc: '2.0', method: 'resources/list', params: {}, id: 'resources-list' })
                });
                if (resourcesResponse.ok) {
                    const resourcesResult = await resourcesResponse.json();
                    hasResources = !!(resourcesResult.result && resourcesResult.result.resources);
                }
            } catch (e) {
                // Resources not supported
            }
            
            try {
                const promptsResponse = await fetch(config.url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ jsonrpc: '2.0', method: 'prompts/list', params: {}, id: 'prompts-list' })
                });
                if (promptsResponse.ok) {
                    const promptsResult = await promptsResponse.json();
                    hasPrompts = !!(promptsResult.result && promptsResult.result.prompts);
                }
            } catch (e) {
                // Prompts not supported
            }
            
            // Build the capabilities object with actual service capabilities
            const capabilities = {};
            if (tools.length > 0) {
                capabilities.tools = {};
            }
            if (hasResources) {
                capabilities.resources = {};
            }
            if (hasPrompts) {
                capabilities.prompts = {};
            }
            
            // Return the initialization response with actual capabilities
            const response = {
                jsonrpc: '2.0',
                result: {
                    protocolVersion: initResult.result?.protocolVersion || '2024-11-05',
                    capabilities: capabilities,
                    serverInfo: initResult.result?.serverInfo || {
                        name: `mcp-gateway-${serviceName}`,
                        version: '1.0.0'
                    }
                },
                id: id || null
            };
            
            eventBus.emit('initialize-complete', { serviceName, capabilities, toolsCount: tools.length });
            return res.json(response);
        }

        // Proxy all other requests directly to the service
        eventBus.emit('proxy-request', { serviceName, method, params, id, url: config.url });
        
        const response = await fetch(config.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jsonrpc: '2.0', method, params, id })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        eventBus.emit('proxy-response', { serviceName, method, id, result });
        
        // Forward the exact response from the service
        res.json(result);
        
    } catch (error) {
        eventBus.emit('error', { serviceName, method, error: error.message });
        res.status(500).json({ 
            jsonrpc: '2.0', 
            error: { code: -32603, message: error.message || 'Internal server error' }, 
            id: id || null 
        });
    }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    eventBus.emit('shutdown', {});
    process.exit(0);
});

app.listen(PORT, '0.0.0.0', () => {
    eventBus.emit('startup', { port: PORT });
    console.log(`🚀 MCP Gateway server running on port ${PORT}`);
    console.log(`📋 Available services: ${Object.keys(MCP_SERVICES).join(', ')}`);
    console.log(`🔗 Service endpoints: http://localhost:${PORT}/mcp/{service-name}`);
    console.log(`💓 Health check: http://localhost:${PORT}/health`);
});

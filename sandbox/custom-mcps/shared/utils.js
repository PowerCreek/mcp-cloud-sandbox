/**
 * Shared utilities for custom MCP server development
 */

/**
 * Create a standard MCP server response
 */
export function createMCPResponse(id, result = null, error = null) {
    const response = {
        jsonrpc: '2.0',
        id: id || null
    };

    if (error) {
        response.error = {
            code: error.code || -32603,
            message: error.message || 'Internal error'
        };
    } else {
        response.result = result;
    }

    return response;
}

/**
 * Create a standard MCP tool definition
 */
export function createMCPTool(name, description, inputSchema) {
    return {
        name,
        description,
        inputSchema: {
            type: 'object',
            properties: inputSchema.properties || {},
            required: inputSchema.required || []
        }
    };
}

/**
 * Validate MCP request format
 */
export function validateMCPRequest(request) {
    if (!request || typeof request !== 'object') {
        return { valid: false, error: 'Request must be an object' };
    }

    if (request.jsonrpc !== '2.0') {
        return { valid: false, error: 'Invalid JSON-RPC version' };
    }

    if (!request.method || typeof request.method !== 'string') {
        return { valid: false, error: 'Method is required and must be a string' };
    }

    return { valid: true };
}

/**
 * Create MCP server initialization response
 */
export function createInitializeResponse(serverInfo, capabilities = {}) {
    return {
        protocolVersion: '2024-11-05',
        capabilities: {
            tools: capabilities.tools || {},
            resources: capabilities.resources || undefined,
            prompts: capabilities.prompts || undefined
        },
        serverInfo: {
            name: serverInfo.name || 'Custom MCP Server',
            version: serverInfo.version || '1.0.0'
        }
    };
}

/**
 * Standard error codes
 */
export const MCPErrorCodes = {
    PARSE_ERROR: -32700,
    INVALID_REQUEST: -32600,
    METHOD_NOT_FOUND: -32601,
    INVALID_PARAMS: -32602,
    INTERNAL_ERROR: -32603
};

/**
 * Log with timestamp for development
 */
export function devLog(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        level: level.toUpperCase(),
        message,
        ...(data && { data })
    };

    console.log(JSON.stringify(logEntry, null, 2));
}

/**
 * Create a simple HTTP server for MCP
 */
export function createMCPServer(port, handlers) {
    const express = require('express');
    const app = express();

    app.use(express.json());
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
        res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
        next();
    });

    // Health check endpoint
    app.get('/health', (req, res) => {
        res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });

    // Main MCP endpoint
    app.post('/', async (req, res) => {
        const validation = validateMCPRequest(req.body);
        if (!validation.valid) {
            return res.json(createMCPResponse(
                req.body?.id,
                null,
                { code: MCPErrorCodes.INVALID_REQUEST, message: validation.error }
            ));
        }

        const { method, params, id } = req.body;

        try {
            if (handlers[method]) {
                const result = await handlers[method](params);
                res.json(createMCPResponse(id, result));
            } else {
                res.json(createMCPResponse(
                    id,
                    null,
                    { code: MCPErrorCodes.METHOD_NOT_FOUND, message: `Method ${method} not found` }
                ));
            }
        } catch (error) {
            devLog('error', `Error handling ${method}`, { error: error.message, params });
            res.json(createMCPResponse(
                id,
                null,
                { code: MCPErrorCodes.INTERNAL_ERROR, message: error.message }
            ));
        }
    });

    return new Promise((resolve) => {
        const server = app.listen(port, '0.0.0.0', () => {
            devLog('info', `MCP server listening on port ${port}`);
            resolve(server);
        });
    });
}

export default {
    createMCPResponse,
    createMCPTool,
    validateMCPRequest,
    createInitializeResponse,
    MCPErrorCodes,
    devLog,
    createMCPServer
};

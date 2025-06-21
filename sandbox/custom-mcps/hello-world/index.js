/**
 * Hello World MCP Server
 * A simple example of a custom MCP server for development testing
 */

import express from 'express';
import {
    createMCPResponse,
    createMCPTool,
    createInitializeResponse,
    validateMCPRequest,
    MCPErrorCodes,
    devLog
} from '../shared/utils.js';

const PORT = process.env.PORT || 3100;
const app = express();

app.use(express.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    next();
});

// Define available tools
const TOOLS = [
    createMCPTool('greet', 'Generate a personalized greeting message', {
        properties: {
            name: {
                type: 'string',
                description: 'The name of the person to greet'
            },
            style: {
                type: 'string',
                description: 'Greeting style: casual, formal, enthusiastic',
                enum: ['casual', 'formal', 'enthusiastic']
            }
        },
        required: ['name']
    }),

    createMCPTool('echo', 'Echo back the provided message with optional formatting', {
        properties: {
            message: {
                type: 'string',
                description: 'The message to echo back'
            },
            uppercase: {
                type: 'boolean',
                description: 'Whether to convert to uppercase'
            },
            repeat: {
                type: 'integer',
                description: 'Number of times to repeat the message',
                minimum: 1,
                maximum: 5
            }
        },
        required: ['message']
    }),

    createMCPTool('get_time', 'Get the current time in various formats', {
        properties: {
            format: {
                type: 'string',
                description: 'Time format: iso, unix, human',
                enum: ['iso', 'unix', 'human']
            },
            timezone: {
                type: 'string',
                description: 'Timezone (e.g., UTC, America/New_York)'
            }
        }
    })
];

// Tool implementations
async function handleGreet(params) {
    const { name, style = 'casual' } = params;

    const greetings = {
        casual: `Hey there, ${name}! 👋`,
        formal: `Good day, ${name}. It's a pleasure to meet you.`,
        enthusiastic: `HELLO ${name}!!! 🎉 SO GREAT TO SEE YOU! 🚀`
    };

    const greeting = greetings[style] || greetings.casual;

    return {
        content: [{
            type: 'text',
            text: greeting
        }]
    };
}

async function handleEcho(params) {
    const { message, uppercase = false, repeat = 1 } = params;

    let result = message;
    if (uppercase) {
        result = result.toUpperCase();
    }

    const repeatedMessage = Array(repeat).fill(result).join(' ');

    return {
        content: [{
            type: 'text',
            text: repeatedMessage
        }]
    };
}

async function handleGetTime(params) {
    const { format = 'iso', timezone } = params;
    const now = new Date();

    let timeString;

    switch (format) {
        case 'iso':
            timeString = now.toISOString();
            break;
        case 'unix':
            timeString = Math.floor(now.getTime() / 1000).toString();
            break;
        case 'human':
            timeString = timezone
                ? now.toLocaleString('en-US', { timeZone: timezone })
                : now.toLocaleString();
            break;
        default:
            timeString = now.toISOString();
    }

    return {
        content: [{
            type: 'text',
            text: `Current time (${format}${timezone ? `, ${timezone}` : ''}): ${timeString}`
        }]
    };
}

// MCP request handlers
const handlers = {
    'initialize': async (params) => {
        devLog('info', 'Initialize request received', params);
        return createInitializeResponse(
            { name: 'hello-world-mcp', version: '1.0.0' },
            { tools: true }
        );
    },

    'tools/list': async () => {
        devLog('info', 'Tools list requested');
        return { tools: TOOLS };
    },

    'tools/call': async (params) => {
        const { name, arguments: args } = params;
        devLog('info', `Tool call: ${name}`, args);

        switch (name) {
            case 'greet':
                return await handleGreet(args);
            case 'echo':
                return await handleEcho(args);
            case 'get_time':
                return await handleGetTime(args);
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
};

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        server: 'hello-world-mcp',
        version: '1.0.0'
    });
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
    devLog('debug', `Received request: ${method}`, { id, params });

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

// Handle notifications (no response required)
app.post('/notifications', (req, res) => {
    const { method, params } = req.body;
    devLog('info', `Notification: ${method}`, params);
    res.status(200).end();
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    devLog('info', `🚀 Hello World MCP Server started on port ${PORT}`);
    devLog('info', '📋 Available tools: greet, echo, get_time');
    devLog('info', `💓 Health check: http://localhost:${PORT}/health`);
});

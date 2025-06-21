const { createMCPServer } = require('../shared/mcp-base.js');
const { logger } = require('../shared/logger.js');

const tools = [
    {
        name: "add",
        description: "Add two numbers",
        inputSchema: {
            type: "object",
            properties: {
                a: { type: "number", description: "First number" },
                b: { type: "number", description: "Second number" }
            },
            required: ["a", "b"]
        }
    },
    {
        name: "subtract",
        description: "Subtract two numbers",
        inputSchema: {
            type: "object",
            properties: {
                a: { type: "number", description: "First number" },
                b: { type: "number", description: "Second number" }
            },
            required: ["a", "b"]
        }
    },
    {
        name: "multiply",
        description: "Multiply two numbers",
        inputSchema: {
            type: "object",
            properties: {
                a: { type: "number", description: "First number" },
                b: { type: "number", description: "Second number" }
            },
            required: ["a", "b"]
        }
    }
];

const toolHandlers = {
    add: async (args) => {
        const result = args.a + args.b;
        return {
            content: [{
                type: "text",
                text: `${args.a} + ${args.b} = ${result}`
            }]
        };
    },

    subtract: async (args) => {
        const result = args.a - args.b;
        return {
            content: [{
                type: "text",
                text: `${args.a} - ${args.b} = ${result}`
            }]
        };
    },

    multiply: async (args) => {
        const result = args.a * args.b;
        return {
            content: [{
                type: "text",
                text: `${args.a} × ${args.b} = ${result}`
            }]
        };
    }
};

createMCPServer('calculator', tools, toolHandlers);

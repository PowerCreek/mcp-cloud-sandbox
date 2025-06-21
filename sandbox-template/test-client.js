import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

/**
 * Example HTTP MCP client for testing the gateway
 */
class HttpMcpClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        this.clients = new Map();
    }

    async getClient(serviceName) {
        if (this.clients.has(serviceName)) {
            return this.clients.get(serviceName);
        }

        const client = new Client({
            name: `http-mcp-client-${serviceName}`,
            version: '1.0.0'
        });

        const transport = new StreamableHTTPClientTransport(
            new URL(`${this.baseUrl}/mcp/${serviceName}`)
        );

        await client.connect(transport);
        this.clients.set(serviceName, client);

        return client;
    }

    async listTools(serviceName) {
        const client = await this.getClient(serviceName);
        return await client.listTools();
    }

    async callTool(serviceName, toolName, params) {
        const client = await this.getClient(serviceName);
        return await client.callTool({ name: toolName, arguments: params });
    }

    async listResources(serviceName) {
        const client = await this.getClient(serviceName);
        return await client.listResources();
    }

    async readResource(serviceName, uri) {
        const client = await this.getClient(serviceName);
        return await client.readResource({ uri });
    }

    async close() {
        for (const [serviceName, client] of this.clients) {
            try {
                await client.close();
                console.log(`✓ Closed client for ${serviceName}`);
            } catch (error) {
                console.error(`Error closing client for ${serviceName}:`, error);
            }
        }
        this.clients.clear();
    }
}

// Example usage
async function testGateway() {
    const client = new HttpMcpClient('http://localhost:8080');

    try {
        console.log('🧪 Testing MCP Gateway...\n');

        // Test Context7 service
        console.log('📚 Testing Context7 service:');
        const context7Tools = await client.listTools('context7');
        console.log('Available tools:', context7Tools.tools?.map(t => t.name) || []);

        // Test Supabase service  
        console.log('\n🗄️  Testing Supabase service:');
        const supabaseTools = await client.listTools('supabase');
        console.log('Available tools:', supabaseTools.tools?.map(t => t.name) || []);

        // Test Sequential Thinking service
        console.log('\n🤔 Testing Sequential Thinking service:');
        const thinkingTools = await client.listTools('sequential-thinking');
        console.log('Available tools:', thinkingTools.tools?.map(t => t.name) || []);

        console.log('\n✅ Gateway test completed successfully!');

    } catch (error) {
        console.error('❌ Gateway test failed:', error);
    } finally {
        await client.close();
    }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testGateway();
}

export { HttpMcpClient };

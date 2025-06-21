#!/usr/bin/env node

/**
 * Test tool to validate MCP HTTP implementation for VS Code compatibility
 * This tool tests the full MCP HTTP protocol handshake and operations
 */

import fetch from 'node-fetch';

class VSCodeMcpTester {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        this.requestId = 1;
    }

    async makeRequest(service, method, params = {}) {
        const url = `${this.baseUrl}/mcp/${service}`;
        const requestId = this.requestId++;

        const request = {
            jsonrpc: '2.0',
            method: method,
            params: params,
            id: requestId
        };

        console.log(`🔄 [${service}] ${method}:`, JSON.stringify(request, null, 2));

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request)
            });

            const responseText = await response.text();

            if (!response.ok) {
                console.log(`❌ [${service}] HTTP ${response.status}:`, responseText);
                return null;
            }

            let result;
            try {
                result = JSON.parse(responseText);
            } catch (e) {
                console.log(`❌ [${service}] Invalid JSON response:`, responseText);
                return null;
            }

            if (result.error) {
                console.log(`❌ [${service}] ${method} failed:`, result.error);
                return null;
            }

            console.log(`✅ [${service}] ${method} success:`, result.result ? '(has result)' : '(no result)');
            return result;

        } catch (error) {
            console.log(`❌ [${service}] Network error:`, error.message);
            return null;
        }
    }

    async testMcpProtocol(serviceName) {
        console.log(`\n🧪 Testing MCP Protocol for service: ${serviceName}`);
        console.log('=' + '='.repeat(50));

        // Step 1: Initialize
        console.log('\n📋 Step 1: Initialize');
        const initResult = await this.makeRequest(serviceName, 'initialize', {
            protocolVersion: '2024-11-05',
            capabilities: {
                roots: {
                    listChanged: true
                },
                sampling: {}
            },
            clientInfo: {
                name: 'vscode-mcp-tester',
                version: '1.0.0'
            }
        });

        if (!initResult) {
            console.log(`❌ Initialize failed for ${serviceName}`);
            return false;
        }

        // Step 2: Initialized notification (should be fire-and-forget)
        console.log('\n📋 Step 2: Initialized notification');
        const initNotification = {
            jsonrpc: '2.0',
            method: 'notifications/initialized'
        };

        try {
            const url = `${this.baseUrl}/mcp/${serviceName}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(initNotification)
            });

            if (response.ok) {
                console.log('✅ Initialized notification sent successfully');
            } else {
                console.log('⚠️  Initialized notification failed, but continuing...');
            }
        } catch (error) {
            console.log('⚠️  Initialized notification error, but continuing...', error.message);
        }

        // Step 3: List tools
        console.log('\n📋 Step 3: List tools');
        const toolsResult = await this.makeRequest(serviceName, 'tools/list');

        if (!toolsResult) {
            console.log(`❌ List tools failed for ${serviceName}`);
            return false;
        }

        const tools = toolsResult.result?.tools || [];
        console.log(`📊 Found ${tools.length} tools:`, tools.map(t => t.name));

        // Step 4: Test tool call (if tools available)
        if (tools.length > 0) {
            console.log('\n📋 Step 4: Test tool call');
            const firstTool = tools[0];

            // Create a simple test argument based on the tool schema
            let testArgs = {};
            if (firstTool.inputSchema?.properties) {
                const props = firstTool.inputSchema.properties;
                const required = firstTool.inputSchema.required || [];

                // Fill in required properties with test values
                for (const prop of required) {
                    const propSchema = props[prop];
                    if (propSchema.type === 'string') {
                        testArgs[prop] = 'test';
                    } else if (propSchema.type === 'number') {
                        testArgs[prop] = 1;
                    } else if (propSchema.type === 'boolean') {
                        testArgs[prop] = true;
                    }
                }
            }

            console.log(`🔧 Testing tool: ${firstTool.name} with args:`, testArgs);

            const callResult = await this.makeRequest(serviceName, 'tools/call', {
                name: firstTool.name,
                arguments: testArgs
            });

            if (callResult) {
                console.log('✅ Tool call succeeded');
            } else {
                console.log('⚠️  Tool call failed (this might be expected with test args)');
            }
        }

        console.log(`\n✅ MCP Protocol test completed for ${serviceName}`);
        return true;
    }

    async testAllServices() {
        console.log('🎯 Testing VS Code MCP Compatibility');
        console.log('====================================\n');

        // Get list of available services
        try {
            const servicesResponse = await fetch(`${this.baseUrl}/services`);
            const servicesData = await servicesResponse.json();
            const services = servicesData.services.map(s => s.name);

            console.log(`📋 Found ${services.length} services:`, services.join(', '));

            // Test each service
            for (const service of services) {
                try {
                    await this.testMcpProtocol(service);
                } catch (error) {
                    console.log(`❌ Failed to test ${service}:`, error.message);
                }
            }

            console.log('\n🎉 All tests completed!');

        } catch (error) {
            console.log('❌ Failed to get services list:', error.message);
        }
    }
}

// Run the tests
const tester = new VSCodeMcpTester('http://localhost:8080');

if (process.argv[2]) {
    // Test specific service
    tester.testMcpProtocol(process.argv[2]);
} else {
    // Test all services
    tester.testAllServices();
}

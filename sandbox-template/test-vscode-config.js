#!/usr/bin/env node

/**
 * VS Code MCP Configuration Validator
 * Tests if our mcp.json configuration will work with VS Code's MCP client
 */

import fetch from 'node-fetch';
import fs from 'fs';

async function testVSCodeConfig() {
    console.log('🔧 Testing VS Code MCP Configuration');
    console.log('====================================\n');

    // Read the mcp.json configuration
    let mcpConfig;
    try {
        const configData = fs.readFileSync('/workspaces/resource-setup-scratch/sandbox/container/mcp.json', 'utf8');
        mcpConfig = JSON.parse(configData);
        console.log('✅ Successfully loaded mcp.json configuration');
    } catch (error) {
        console.error('❌ Failed to load mcp.json:', error.message);
        return;
    }

    console.log(`📋 Found ${Object.keys(mcpConfig.servers).length} configured servers:\n`);

    // Test each configured server
    for (const [serverName, config] of Object.entries(mcpConfig.servers)) {
        console.log(`🧪 Testing server: ${serverName}`);
        console.log(`   URL: ${config.url}`);
        console.log(`   Type: ${config.type}`);

        if (config.type !== 'http') {
            console.log('   ⚠️  Skipping - not HTTP type\n');
            continue;
        }

        try {
            // Test VS Code MCP protocol handshake
            const initRequest = {
                jsonrpc: '2.0',
                method: 'initialize',
                params: {
                    protocolVersion: '2024-11-05',
                    capabilities: {
                        roots: { listChanged: true },
                        sampling: {}
                    },
                    clientInfo: {
                        name: 'VS Code',
                        version: '1.0.0'
                    }
                },
                id: 1
            };

            const response = await fetch(config.url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(initRequest),
                timeout: 5000
            });

            if (response.ok) {
                const result = await response.json();
                if (result.result && result.result.serverInfo) {
                    console.log('   ✅ VS Code compatible - initialize successful');
                    console.log(`   📊 Server: ${result.result.serverInfo.name} v${result.result.serverInfo.version}`);

                    // Test tools list
                    const toolsRequest = {
                        jsonrpc: '2.0',
                        method: 'tools/list',
                        id: 2
                    };

                    const toolsResponse = await fetch(config.url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(toolsRequest)
                    });

                    if (toolsResponse.ok) {
                        const toolsResult = await toolsResponse.json();
                        const toolCount = toolsResult.result?.tools?.length || 0;
                        console.log(`   🔧 Tools available: ${toolCount}`);
                    }
                } else {
                    console.log('   ❌ Invalid initialize response format');
                }
            } else {
                const errorText = await response.text();
                console.log(`   ❌ HTTP ${response.status}: ${errorText.substring(0, 100)}...`);
            }

        } catch (error) {
            console.log(`   ❌ Connection failed: ${error.message}`);
        }

        console.log(); // Empty line
    }

    console.log('🎯 VS Code Configuration Test Complete!');
    console.log('\n📋 Configuration Summary:');
    console.log('   - Working services should be usable in VS Code');
    console.log('   - Copy container/mcp.json to your VS Code settings');
    console.log('   - Update URLs from mcp-gateway:8080 to localhost:8080 for external access');
}

testVSCodeConfig();

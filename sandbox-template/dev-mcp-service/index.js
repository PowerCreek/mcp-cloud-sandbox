/**
 * Development MCP Service Manager
 * Dynamically loads and manages custom MCP servers from the custom-mcps directory
 */

import express from 'express';
import fetch from 'node-fetch';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import chokidar from 'chokidar';

const PORT = process.env.PORT || 3200;
const CUSTOM_MCPS_DIR = process.env.CUSTOM_MCPS_DIR || '/app/custom-mcps';
const GATEWAY_URL = process.env.GATEWAY_URL || 'http://mcp-gateway:8080';
const BASE_PORT = 3100;

class DevMCPServiceManager {
    constructor() {
        this.services = new Map();
        this.portCounter = BASE_PORT;
        this.watchers = new Map();
        this.app = express();
        this.setupExpress();
    }

    setupExpress() {
        this.app.use(express.json());
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Content-Type');
            res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, DELETE');
            next();
        });

        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                services: Array.from(this.services.keys()),
                totalServices: this.services.size
            });
        });

        // List managed services
        this.app.get('/services', (req, res) => {
            const serviceList = Array.from(this.services.entries()).map(([name, service]) => ({
                name,
                port: service.port,
                status: service.status,
                pid: service.process?.pid,
                lastStarted: service.lastStarted,
                errors: service.errors
            }));

            res.json({ services: serviceList });
        });

        // Proxy requests to custom MCP services
        this.app.all('/dev/:serviceName', async (req, res) => {
            const { serviceName } = req.params;
            const service = this.services.get(serviceName);

            if (!service || service.status !== 'running') {
                return res.status(404).json({
                    jsonrpc: '2.0',
                    error: { code: -32000, message: `Service ${serviceName} not available` },
                    id: req.body?.id || null
                });
            }

            try {
                const response = await fetch(`http://localhost:${service.port}`, {
                    method: req.method,
                    headers: { 'Content-Type': 'application/json' },
                    body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
                });

                const result = await response.json();
                res.json(result);
            } catch (error) {
                this.log('error', `Proxy error for ${serviceName}`, error.message);
                res.status(500).json({
                    jsonrpc: '2.0',
                    error: { code: -32603, message: `Proxy error: ${error.message}` },
                    id: req.body?.id || null
                });
            }
        });

        // Manual service control
        this.app.post('/services/:serviceName/restart', async (req, res) => {
            const { serviceName } = req.params;
            await this.restartService(serviceName);
            res.json({ message: `Service ${serviceName} restart initiated` });
        });

        this.app.delete('/services/:serviceName', async (req, res) => {
            const { serviceName } = req.params;
            await this.stopService(serviceName);
            res.json({ message: `Service ${serviceName} stopped` });
        });
    }

    log(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level: level.toUpperCase(),
            message,
            ...(data && { data })
        };
        console.log(JSON.stringify(logEntry, null, 2));
    }

    async scanForProjects() {
        this.log('info', 'Scanning for custom MCP projects');

        try {
            const entries = await fs.readdir(CUSTOM_MCPS_DIR, { withFileTypes: true });

            for (const entry of entries) {
                if (entry.isDirectory() && entry.name !== 'shared') {
                    const projectPath = path.join(CUSTOM_MCPS_DIR, entry.name);
                    const packageJsonPath = path.join(projectPath, 'package.json');

                    try {
                        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));

                        if (packageJson.mcpServer) {
                            await this.loadProject(entry.name, projectPath, packageJson);
                        } else {
                            this.log('warn', `Skipping ${entry.name}: no mcpServer config in package.json`);
                        }
                    } catch (error) {
                        this.log('warn', `Skipping ${entry.name}: ${error.message}`);
                    }
                }
            }
        } catch (error) {
            this.log('error', 'Failed to scan custom MCP directory', error.message);
        }
    }

    async loadProject(name, projectPath, packageJson) {
        this.log('info', `Loading MCP project: ${name}`);

        const mcpConfig = packageJson.mcpServer;
        const port = this.portCounter++;

        // Install dependencies
        await this.installDependencies(projectPath);

        // Start the service
        await this.startService(name, projectPath, port, mcpConfig);

        // Setup file watcher for hot reload
        this.setupWatcher(name, projectPath);

        // Register with gateway
        await this.registerWithGateway(name, port, mcpConfig);
    }

    async installDependencies(projectPath) {
        return new Promise((resolve, reject) => {
            this.log('info', `Installing dependencies for ${projectPath}`);

            const npm = spawn('npm', ['install'], {
                cwd: projectPath,
                stdio: ['ignore', 'pipe', 'pipe']
            });

            npm.on('close', (code) => {
                if (code === 0) {
                    this.log('info', 'Dependencies installed successfully');
                    resolve();
                } else {
                    this.log('error', `npm install failed with code ${code}`);
                    reject(new Error(`npm install failed with code ${code}`));
                }
            });
        });
    }

    async startService(name, projectPath, port, mcpConfig) {
        this.log('info', `Starting service ${name} on port ${port}`);

        const service = {
            name,
            projectPath,
            port,
            config: mcpConfig,
            status: 'starting',
            lastStarted: new Date().toISOString(),
            errors: []
        };

        const env = {
            ...process.env,
            PORT: port.toString(),
            NODE_ENV: 'development'
        };

        const nodeProcess = spawn('node', ['index.js'], {
            cwd: projectPath,
            env,
            stdio: ['ignore', 'pipe', 'pipe']
        });

        service.process = nodeProcess;

        nodeProcess.stdout.on('data', (data) => {
            this.log('info', `[${name}] ${data.toString().trim()}`);
        });

        nodeProcess.stderr.on('data', (data) => {
            const error = data.toString().trim();
            this.log('error', `[${name}] ${error}`);
            service.errors.push({ timestamp: new Date().toISOString(), message: error });
        });

        nodeProcess.on('close', (code) => {
            this.log('info', `Service ${name} exited with code ${code}`);
            service.status = 'stopped';

            if (code !== 0) {
                service.errors.push({
                    timestamp: new Date().toISOString(),
                    message: `Process exited with code ${code}`
                });
            }
        });

        // Wait a moment for startup
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check if service is healthy
        try {
            const response = await fetch(`http://localhost:${port}/health`);
            if (response.ok) {
                service.status = 'running';
                this.log('info', `Service ${name} is healthy and running`);
            } else {
                service.status = 'error';
                service.errors.push({
                    timestamp: new Date().toISOString(),
                    message: `Health check failed: ${response.status}`
                });
            }
        } catch (error) {
            service.status = 'error';
            service.errors.push({
                timestamp: new Date().toISOString(),
                message: `Health check failed: ${error.message}`
            });
        }

        this.services.set(name, service);
    }

    setupWatcher(name, projectPath) {
        const watcher = chokidar.watch(projectPath, {
            ignored: /node_modules/,
            persistent: true
        });

        watcher.on('change', async (filePath) => {
            if (filePath.endsWith('.js') || filePath.endsWith('.json')) {
                this.log('info', `File changed in ${name}: ${filePath}`);
                this.log('info', `Restarting service ${name}...`);
                await this.restartService(name);
            }
        });

        this.watchers.set(name, watcher);
    }

    async registerWithGateway(name, port, mcpConfig) {
        const maxRetries = 5;
        const retryDelay = 2000; // 2 seconds

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                this.log('info', `Attempting to register ${name} with gateway (attempt ${attempt}/${maxRetries})`);

                const response = await fetch(`${GATEWAY_URL}/discovery/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        serviceName: name, // Register directly as "hello-world", not "dev/hello-world"
                        serviceConfig: {
                            url: `http://dev-mcp-service:${port}`, // Point directly to the service port
                            description: `Custom development MCP: ${mcpConfig.description || name}`,
                            capabilities: mcpConfig.capabilities || { tools: true }
                        }
                    })
                });

                if (response.ok) {
                    const result = await response.json();
                    this.log('info', `Successfully registered ${name} with gateway`, result);
                    return true;
                } else {
                    const errorText = await response.text();
                    this.log('error', `Failed to register ${name} with gateway (attempt ${attempt}): ${response.status} - ${errorText}`);
                }
            } catch (error) {
                this.log('error', `Gateway registration error for ${name} (attempt ${attempt}): ${error.message}`);
            }

            if (attempt < maxRetries) {
                this.log('info', `Waiting ${retryDelay}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
        }

        this.log('error', `Failed to register ${name} with gateway after ${maxRetries} attempts`);
        return false;
    }

    async restartService(name) {
        const service = this.services.get(name);
        if (!service) return;

        // Stop the current process
        if (service.process) {
            service.process.kill();
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Restart the service
        await this.startService(name, service.projectPath, service.port, service.config);

        // Re-register with gateway
        await this.registerWithGateway(name, service.port, service.config);
    }

    async stopService(name) {
        const service = this.services.get(name);
        if (!service) return;

        if (service.process) {
            service.process.kill();
        }

        const watcher = this.watchers.get(name);
        if (watcher) {
            await watcher.close();
            this.watchers.delete(name);
        }

        this.services.delete(name);
        this.log('info', `Service ${name} stopped and removed`);
    }

    async start() {
        this.log('info', 'Starting Dev MCP Service Manager');

        // Initial scan for projects
        await this.scanForProjects();

        // Start HTTP server
        this.app.listen(PORT, '0.0.0.0', () => {
            this.log('info', `🚀 Dev MCP Service Manager listening on port ${PORT}`);
            this.log('info', `📁 Scanning directory: ${CUSTOM_MCPS_DIR}`);
            this.log('info', `🔗 Gateway URL: ${GATEWAY_URL}`);
            this.log('info', `📋 Managed services: ${Array.from(this.services.keys()).join(', ')}`);
        });

        // Graceful shutdown
        process.on('SIGTERM', async () => {
            this.log('info', 'Shutting down Dev MCP Service Manager');

            for (const [name] of this.services) {
                await this.stopService(name);
            }

            process.exit(0);
        });
    }
}

// Start the service manager
const manager = new DevMCPServiceManager();
manager.start().catch(error => {
    console.error('Failed to start Dev MCP Service Manager:', error);
    process.exit(1);
});

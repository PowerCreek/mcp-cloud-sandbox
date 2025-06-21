import fetch from 'node-fetch';
import { eventBus } from './eventBus.js';

/**
 * MCP Service Discovery Manager
 * Handles both static service registration and dynamic discovery
 */
export class MCPServiceDiscovery {
    constructor() {
        this.services = new Map();
        this.discoveryEndpoints = new Set();
        this.refreshInterval = 30000; // 30 seconds
        this.lastRefresh = 0;
        
        eventBus.emit('discovery-init', { timestamp: new Date().toISOString() });
    }

    /**
     * Register static services (existing hardcoded services)
     */
    registerStaticServices(staticServices) {
        for (const [serviceName, config] of Object.entries(staticServices)) {
            this.services.set(serviceName, {
                ...config,
                type: 'static',
                registered: new Date().toISOString()
            });
            eventBus.emit('service-registered', { 
                serviceName, 
                type: 'static', 
                url: config.url 
            });
        }
        console.log(`📋 Registered ${Object.keys(staticServices).length} static services`);
    }

    /**
     * Add discovery endpoint for dynamic service registration
     */
    addDiscoveryEndpoint(endpoint) {
        this.discoveryEndpoints.add(endpoint);
        eventBus.emit('discovery-endpoint-added', { endpoint });
        console.log(`🔍 Added discovery endpoint: ${endpoint}`);
    }

    /**
     * Register a service dynamically via API
     */
    async registerDynamicService(serviceName, serviceConfig) {
        const config = {
            ...serviceConfig,
            type: 'dynamic',
            registered: new Date().toISOString()
        };

        // Validate service health before registering
        try {
            const healthCheck = await fetch(`${serviceConfig.url}/health`, {
                method: 'GET',
                timeout: 5000
            });
            
            if (!healthCheck.ok) {
                throw new Error(`Health check failed: ${healthCheck.status}`);
            }

            this.services.set(serviceName, config);
            eventBus.emit('service-registered', { 
                serviceName, 
                type: 'dynamic', 
                url: serviceConfig.url 
            });
            console.log(`✅ Dynamically registered service: ${serviceName}`);
            return true;
        } catch (error) {
            eventBus.emit('service-registration-failed', { 
                serviceName, 
                error: error.message 
            });
            console.error(`❌ Failed to register service ${serviceName}: ${error.message}`);
            return false;
        }
    }

    /**
     * Unregister a service
     */
    unregisterService(serviceName) {
        if (this.services.has(serviceName)) {
            const service = this.services.get(serviceName);
            this.services.delete(serviceName);
            eventBus.emit('service-unregistered', { serviceName, type: service.type });
            console.log(`🗑️ Unregistered service: ${serviceName}`);
            return true;
        }
        return false;
    }

    /**
     * Get service configuration by name
     */
    getService(serviceName) {
        return this.services.get(serviceName);
    }

    /**
     * Get all registered services
     */
    getAllServices() {
        return Object.fromEntries(this.services);
    }

    /**
     * Get services by type (static or dynamic)
     */
    getServicesByType(type) {
        const filtered = new Map();
        for (const [name, config] of this.services) {
            if (config.type === type) {
                filtered.set(name, config);
            }
        }
        return Object.fromEntries(filtered);
    }

    /**
     * Refresh dynamic services from discovery endpoints
     */
    async refreshDynamicServices() {
        if (Date.now() - this.lastRefresh < this.refreshInterval) {
            return; // Skip if refreshed recently
        }

        eventBus.emit('discovery-refresh-start', { 
            endpointCount: this.discoveryEndpoints.size 
        });

        for (const endpoint of this.discoveryEndpoints) {
            try {
                const response = await fetch(endpoint, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 10000
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const discoveredServices = await response.json();
                
                if (discoveredServices.services && Array.isArray(discoveredServices.services)) {
                    for (const service of discoveredServices.services) {
                        if (service.name && service.url) {
                            await this.registerDynamicService(service.name, {
                                url: service.url,
                                description: service.description || 'Dynamically discovered service',
                                capabilities: service.capabilities || {}
                            });
                        }
                    }
                }
            } catch (error) {
                eventBus.emit('discovery-endpoint-error', { 
                    endpoint, 
                    error: error.message 
                });
                console.error(`🔍❌ Discovery endpoint error (${endpoint}): ${error.message}`);
            }
        }

        this.lastRefresh = Date.now();
        eventBus.emit('discovery-refresh-complete', { 
            serviceCount: this.services.size,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Health check for all registered services
     */
    async healthCheckServices() {
        const results = new Map();
        
        for (const [serviceName, config] of this.services) {
            try {
                const response = await fetch(`${config.url}/health`, {
                    method: 'GET',
                    timeout: 5000
                });
                
                results.set(serviceName, {
                    healthy: response.ok,
                    status: response.status,
                    type: config.type,
                    lastCheck: new Date().toISOString()
                });
                
                if (!response.ok) {
                    eventBus.emit('service-unhealthy', { 
                        serviceName, 
                        status: response.status 
                    });
                }
            } catch (error) {
                results.set(serviceName, {
                    healthy: false,
                    error: error.message,
                    type: config.type,
                    lastCheck: new Date().toISOString()
                });
                
                eventBus.emit('service-unhealthy', { 
                    serviceName, 
                    error: error.message 
                });
            }
        }
        
        return Object.fromEntries(results);
    }

    /**
     * Get discovery statistics
     */
    getStats() {
        const stats = {
            totalServices: this.services.size,
            staticServices: 0,
            dynamicServices: 0,
            discoveryEndpoints: this.discoveryEndpoints.size,
            lastRefresh: this.lastRefresh ? new Date(this.lastRefresh).toISOString() : null
        };

        for (const [, config] of this.services) {
            if (config.type === 'static') {
                stats.staticServices++;
            } else if (config.type === 'dynamic') {
                stats.dynamicServices++;
            }
        }

        return stats;
    }

    /**
     * Start automatic discovery refresh
     */
    startAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }

        this.refreshTimer = setInterval(async () => {
            await this.refreshDynamicServices();
        }, this.refreshInterval);

        eventBus.emit('auto-refresh-started', { 
            interval: this.refreshInterval 
        });
        console.log(`🔄 Started auto-refresh with ${this.refreshInterval}ms interval`);
    }

    /**
     * Stop automatic discovery refresh
     */
    stopAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
            eventBus.emit('auto-refresh-stopped', {});
            console.log(`⏹️ Stopped auto-refresh`);
        }
    }
}

export default MCPServiceDiscovery;

// Simple event bus for MCP HTTP bridge
class EventBus {
    constructor() {
        this.listeners = {};
    }

    on(event, listener) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(listener);
    }

    off(event, listener) {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(l => l !== listener);
    }

    emit(event, data) {
        // Log all events for container visibility
        try {
            console.log(`[eventBus] Event: ${event}`, JSON.stringify(data, null, 2));
        } catch (e) {
            console.log(`[eventBus] Event: ${event} (unserializable data)`);
        }
        if (!this.listeners[event]) return;
        for (const listener of this.listeners[event]) {
            listener(data);
        }
    }
}

export const eventBus = new EventBus();

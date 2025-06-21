// Simple logger for MCP services
const logger = {
    info: (message, data = null) => {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level: 'INFO',
            message,
            ...(data && { data })
        };
        console.log(JSON.stringify(logEntry, null, 2));
    },

    error: (message, data = null) => {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level: 'ERROR',
            message,
            ...(data && { data })
        };
        console.error(JSON.stringify(logEntry, null, 2));
    },

    debug: (message, data = null) => {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level: 'DEBUG',
            message,
            ...(data && { data })
        };
        console.log(JSON.stringify(logEntry, null, 2));
    }
};

module.exports = { logger };

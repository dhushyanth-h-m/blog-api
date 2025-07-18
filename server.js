#!/usr/bin/env nodemon 
/**
 * Blog API server
 * Production-ready Express server with MongoDB, 
 * Redis, and comprehensive middleware
 */

const app = require('./src/app');
const logger = require('./src/config/logger');
const { connectDB } = require('./src/config/database');
const { connectRedis } = require('./src/config/redis');

// Handle uncaught exceptions
process.on('unhandledRejection', (err, promise) => {
    logger.error('Unhandled Rejection at: ', promise, 'reason:', err);
    process.exit(1);
})

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully....');
    server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
    });
});

process.on('SIGINIT', () => {
    logger.info('SIGINIT received. Shitting down gracefully....');
    server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
    });
});

// start server
const startServer = async () => {
    try {
        // Connect to Databases
        await connectDB();
        await connectRedis();

        // Start HTTP server
        const PORT = process.env.PORT || 3000;
        const server = app.listen(PORT, () => {
            logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
            logger.info(`API Documentation: http://localhost:${PORT}/api/docs`);
            logger.info(`Health Check: http://localhost:${PORT}/api/health`);
        });

        // Server timeout
        server.timeout = 120000;

        return server;
    } catch (error) {
        logger.error('Failed to start server: ', error);
        process.exit(1);
    }
};

// Start the server
const server = startServer();

module.exports = server;
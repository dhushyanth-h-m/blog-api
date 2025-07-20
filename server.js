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

process.on('SIGINT', () => {
    logger.info('SIGINT received. Shutting down gracefully....');
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

        // Warm cache after database connections are established
        try {
            logger.info('Starting cache warming process...');
            const cacheService = require('./src/services/cacheService');
            const warmResult = await cacheService.warmCache();
            
            if (warmResult.success) {
                logger.info(`Cache warming completed: ${warmResult.warmedCount} entries cached`);
            } else {
                logger.warn('Cache warming failed, continuing without warm cache:', warmResult.error);
            }
        } catch (cacheError) {
            // Don't fail server startup if cache warming fails
            logger.warn('Cache warming error, continuing without warm cache:', cacheError.message);
        }

        // Start HTTP server
        const PORT = process.env.PORT || 3000;
        const server = app.listen(PORT, () => {
            logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
            logger.info(`API Documentation: http://localhost:${PORT}/api/docs`);
            logger.info(`Health Check: http://localhost:${PORT}/api/health`);
            logger.info(`Cache Management: http://localhost:${PORT}/api/blogs/cache/stats`);
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
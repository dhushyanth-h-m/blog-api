const Redis = require('ioredis');
const logger = require('./logger');

let redisClient = null;

const connectRedis = async () => {
    try {
        if (process.env.REDIS_HOST) {
            redisClient = new Redis({
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT || 6379,
                password: process.env.REDIS_PASSWORD || undefined,
                db: process.env.REDIS_DB || 0
            });
            
            // Wait for connection to be established
            await redisClient.ping();
            logger.info('Redis Connected');
            
            redisClient.on('error', (err) => {
                logger.error('Redis error:', err);
            });
            
            redisClient.on('close', () => {
                logger.warn('Redis connection closed');
            });
            
        } else {
            logger.warn('Redis connection skipped - REDIS_HOST not set');
        }
    } catch (error) {
        logger.error('Redis connection error:', error);
        redisClient = null;
        // Don't exit process - Redis is optional
    }
};

const disconnectRedis = async () => {
    try {
        if (redisClient) {
            await redisClient.quit();
            redisClient = null;
            logger.info('Redis disconnected');
        }
    } catch (error) {
        logger.error('Redis disconnect error:', error);
    }
};

module.exports = { 
    connectRedis, 
    disconnectRedis, 
    get redisClient() { return redisClient; } 
};

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
            
            redisClient.on('connect', () => {
                logger.info('Redis Connected');
            });
            
            redisClient.on('error', (err) => {
                logger.error('Redis error:', err);
            });
        } else {
            logger.warn('Redis connection skipped - REDIS_HOST not set');
        }
    } catch (error) {
        logger.error('Redis connection error:', error);
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

module.exports = { connectRedis, disconnectRedis, redisClient };

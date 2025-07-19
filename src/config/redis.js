const Redis = require('ioredis');
const logger = require('./logger');

let redisClient = null;

const connectRedis = async () => {
    try {
        if (process.env.REDIS_HOST) {
            redisClient = new Redis({
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT || 6379
            });
            logger.info('Redis Connected');
        } else {
            logger.warn('Redis connection skipped - REDIS_HOST not set');
        }
    } catch (error) {
        logger.error('Redis connection error:', error);
        // Don't exit process - Redis is optional
    }
};

module.exports = { connectRedis, redisClient };

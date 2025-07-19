const redis = require('../config/redis');
const logger = require('../config/logger');

const cacheMiddleware = (ttl = 300) => { // Default 5 minutes
    return async (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        // Get current Redis client (using getter property)
        const client = redis.redisClient;

        // Graceful degradation: If Redis is not connected, skip caching
        if (!client) {
            logger.warn('Redis client not available. Skipping cache.');
            res.setHeader('X-Cache', 'DISABLED');
            return next();
        }

        // Check if Redis is actually connected
        try {
            await client.ping();
        } catch (error) {
            logger.warn('Redis connection failed. Skipping cache.');
            res.setHeader('X-Cache', 'DISABLED');
            return next();
        }

        const key = `__express__${req.originalUrl || req.url}`;

        try {
            const cachedData = await client.get(key);
            
            if (cachedData) {
                // Cache HIT
                res.setHeader('X-Cache', 'HIT');
                res.setHeader('Content-Type', 'application/json');
                logger.info(`Cache HIT for key: ${key}`);
                return res.send(JSON.parse(cachedData));
            } else {
                // Cache MISS - intercept response to store it
                res.setHeader('X-Cache', 'MISS');
                logger.info(`Cache MISS for key: ${key}`);

                // Store original send method
                const originalSend = res.send;
                
                // Override send method to cache the response
                res.send = function(body) {
                    // Cache the response only for successful requests
                    if (res.statusCode === 200 && typeof body === 'string') {
                        client.setex(key, ttl, body)
                            .then(() => {
                                logger.info(`Response cached for key: ${key} (TTL: ${ttl}s)`);
                            })
                            .catch(err => {
                                logger.error('Redis SET error:', err);
                            });
                    }
                    
                    // Call original send
                    originalSend.call(this, body);
                };
                
                next();
            }
        } catch (err) {
            logger.error('Redis GET error:', err);
            res.setHeader('X-Cache', 'ERROR');
            next();
        }
    };
};

module.exports = cacheMiddleware;
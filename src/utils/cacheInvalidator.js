const { redisClient } = require('../config/redis');
const logger = require('../config/logger');

const clearCache = async (key) => {
    try {
        const client = redisClient;
        if (client) {
            await client.del(key);
            logger.info(`Cache invalidated for key: ${key}`);
        }
    } catch (error) {
        logger.error(`Error invalidating cache for key ${key}:`, error);
    }
};

const clearAllBlogsCache = async () => {
    const key = '__express__/api/blogs';
    await clearCache(key);
};

const clearSingleBlogCache = async (id) => {
    const key = `__express__/api/blogs/${id}`;
    await clearCache(key);
};

module.exports = {
    clearAllBlogsCache, 
    clearSingleBlogCache,
    clearCache
};
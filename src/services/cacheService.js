const redis = require('../config/redis');
const logger = require('../config/logger');

class CacheService {
    constructor() {
        this.defaultTTL = 3600;
        this.keyPrefix = 'blog-api';

        // Cache configuration for different data types
        this.cacheConfig = {
            blogs: { ttl: 1800, prefix: 'blogs:' },
            users: { ttl: 3600, prefix: 'users:' },
            auth: { ttl: 900, prefix: 'auth:' },
            search: { ttl: 600, prefix: 'search:' },
        };
    }

    /**
     * Generate cache key with prefix 
     */
    _generateKey(type, identifier) {
        const config = this.cacheConfig[type] || { prefix: '' };
        return `${this.keyPrefix}${config.prefix}${identifier}`;
    }

    /**
     * Get value from cache
     */
    async get(type, identifier) {
        try {
            if (!redis.redisClient || redis.redisClient.status !== 'ready') {
                logger.warn('Redis client not available for GET operation');
                return null;
            }

            const key = this._generateKey(type, identifier);
            const value = await redis.redisClient.get(key);

            if (value) {
                logger.debug(`Cache HIT: ${key}`);
                return JSON.parse(value);
            }

            logger.debug(`Cache MISS: ${key}`);
            return null;
        } catch (error) {
            logger.error('Cache GET error: ', error);
            return null;
        }
    }

    /**
     * Set value in cache
     */
    async set(type, identifier, data, customTTL = null) {
        try {
            if (!redis.redisClient || redis.redisClient.status !== 'ready') {
                logger.warn('Redis client not available for SET operation');
                return false;
            }

            const key = this._generateKey(type, identifier);
            const config = this.cacheConfig[type] || { ttl: this.defaultTTL };
            const ttl = customTTL || config.ttl;

            await redis.redisClient.setex(key, ttl, JSON.stringify(data));
            logger.debug(`Cache SET: ${key} (TTL: ${ttl}s)`);
            return true;
        } catch (error) {
            logger.error('Cache SET error: ', error);
            return false;
        }
    }

    /**
     * Delete specific cache entry
     */
    async del(type, identifier) {
        try {
            if (!redis.redisClient || redis.redisClient.status !== 'ready') {
                logger.warn('Redis client not available for DEL operation');
                return false;
            }

            const key = this._generateKey(type, identifier);
            const result = await redis.redisClient.del(key);
            logger.debug(`Cache DEL: ${key} (${result ? 'success' : 'not found'})`);
            return result > 0;
        } catch (error) {
            logger.error('Cache DEL error: ', error);
            return false;
        }
    }

    /**
     * Delete multiple cache entries by pattern
     */
    async delPattern(pattern) {
        try {
            if (!redis.redisClient || redis.redisClient.status !== 'ready') {
                logger.warn('Redis client not available for DEL PATTERN operation');
                return 0;
            }

            const fullPattern = `${this.keyPrefix}${pattern}`;
            const keys = await redis.redisClient.keys(fullPattern);
            
            if (keys.length === 0) {
                logger.debug(`Cache DEL PATTERN: No keys found for ${fullPattern}`);
                return 0;
            }

            const result = await redis.redisClient.del(keys);
            logger.debug(`Cache DEL PATTERN: ${fullPattern} (${result} keys deleted)`);
            return result;
        } catch (error) {
            logger.error('Cache DEL PATTERN error:', error);
            return 0;
        }
    }

    /**
     * Cache blog list with filters
     */
    async getBlogList(filters = {}) {
        const filterKey = JSON.stringify(filters);
        const hashedKey = require('crypto')
            .createHash('md5')
            .update(filterKey)
            .digest('hex');
        
        return this.get('blogs', `list:${hashedKey}`);
    }

    async setBlogList(filters = {}, data) {
        const filterKey = JSON.stringify(filters);
        const hashedKey = require('crypto')
            .createHash('md5')
            .update(filterKey)
            .digest('hex');
        
        return this.set('blogs', `list:${hashedKey}`, data);
    }

    /**
     * Cache individual blog post
     */
    async getBlog(blogId) {
        return this.get('blogs', `detail:${blogId}`);
    }

    async setBlog(blogId, blogData) {
        return this.set('blogs', `detail:${blogId}`, blogData);
    }

    /**
     * Cache user data
     */
    async getUser(userId) {
        return this.get('users', `profile:${userId}`);
    }

    async setUser(userId, userData) {
        return this.set('users', `profile:${userId}`, userData);
    }

    /**
     * Cache search results
     */
    async getSearchResults(query, filters = {}) {
        const searchKey = JSON.stringify({ query, filters });
        const hashedKey = require('crypto')
            .createHash('md5')
            .update(searchKey)
            .digest('hex');
        
        return this.get('search', `results:${hashedKey}`);
    }

    async setSearchResults(query, filters = {}, results) {
        const searchKey = JSON.stringify({ query, filters });
        const hashedKey = require('crypto')
            .createHash('md5')
            .update(searchKey)
            .digest('hex');
        
        return this.set('search', `results:${hashedKey}`, results);
    }

    /**
     * Invalidate blog-related caches
     */
    async invalidateBlogCaches(blogId = null) {
        const patterns = ['blogs:list:*', 'search:results:*'];
        
        if (blogId) {
            patterns.push(`blogs:detail:${blogId}`);
        }

        let totalDeleted = 0;
        for (const pattern of patterns) {
            totalDeleted += await this.delPattern(pattern);
        }

        logger.info(`Invalidated ${totalDeleted} blog-related cache entries`);
        return totalDeleted;
    }

    /**
     * Invalidate user-related caches
     */
    async invalidateUserCaches(userId = null) {
        const patterns = ['users:*'];
        
        if (userId) {
            patterns.push(`auth:${userId}:*`);
        }

        let totalDeleted = 0;
        for (const pattern of patterns) {
            totalDeleted += await this.delPattern(pattern);
        }

        logger.info(`Invalidated ${totalDeleted} user-related cache entries`);
        return totalDeleted;
    }

    /**
     * Cache statistics
     */
    async getStats() {
        try {
            if (!redis.redisClient || redis.redisClient.status !== 'ready') {
                return null;
            }

            const info = await redis.redisClient.info('memory');
            const keyspace = await redis.redisClient.info('keyspace');
            const stats = await redis.redisClient.info('stats');

            return {
                memory: this._parseInfo(info),
                keyspace: this._parseInfo(keyspace),
                stats: this._parseInfo(stats),
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            logger.error('Cache stats error:', error);
            return null;
        }
    }

    /**
     * Parse Redis INFO response
     */
    _parseInfo(info) {
        const result = {};
        const lines = info.split('\r\n');
        
        lines.forEach(line => {
            if (line.includes(':')) {
                const [key, value] = line.split(':');
                result[key] = isNaN(value) ? value : Number(value);
            }
        });

        return result;
    }

    /**
     * Warm cache with frequently accessed data
     */
    async warmCache() {
        try {
            logger.info('Starting cache warming...');
            let warmedCount = 0;

            // Import models here to avoid circular dependencies
            const Blog = require('../models/Blog');
            const User = require('../models/User');

            // 1. Cache recent published blogs (most frequently accessed)
            logger.info('Warming cache: Recent published blogs');
            const recentBlogs = await Blog.find({ status: 'published' })
                .populate('author', 'name email')
                .sort({ createdAt: -1 })
                .limit(20)
                .lean();

            for (const blog of recentBlogs) {
                await this.setBlog(blog._id, blog);
                warmedCount++;
            }

            // 2. Cache the most common blog list queries
            logger.info('Warming cache: Common blog list queries');
            
            // Published blogs list (default view)
            const publishedBlogs = await Blog.find({ status: 'published' })
                .populate('author', 'name email')
                .sort({ createdAt: -1 })
                .limit(50)
                .lean();
            
            await this.setBlogList({}, publishedBlogs);
            warmedCount++;

            // Published blogs sorted by creation date
            await this.setBlogList({ sort: 'createdAt', order: 'desc' }, publishedBlogs);
            warmedCount++;

            // 3. Cache active users (users who have published blogs)
            logger.info('Warming cache: Active user profiles');
            const activeUserIds = [...new Set(recentBlogs.map(blog => blog.author._id.toString()))];
            
            for (const userId of activeUserIds.slice(0, 10)) { // Limit to 10 most active users
                const user = await User.findById(userId).lean();
                if (user) {
                    // Remove password from cached user data
                    const { password, ...userWithoutPassword } = user;
                    await this.setUser(userId, userWithoutPassword);
                    warmedCount++;
                }
            }

            // 4. Cache system-level data that rarely changes
            logger.info('Warming cache: System data');
            
            // Total blog count
            const totalBlogs = await Blog.countDocuments({ status: 'published' });
            await this.set('system', 'blog_count', { count: totalBlogs, lastUpdated: new Date() });
            warmedCount++;

            // Total user count
            const totalUsers = await User.countDocuments();
            await this.set('system', 'user_count', { count: totalUsers, lastUpdated: new Date() });
            warmedCount++;

            // 5. Pre-cache popular search terms (if you have analytics data)
            logger.info('Warming cache: Popular search patterns');
            const popularSearches = [
                'javascript', 'node.js', 'react', 'tutorial', 'guide'
            ];

            for (const searchTerm of popularSearches) {
                const searchResults = await Blog.find({
                    status: 'published',
                    $or: [
                        { title: { $regex: searchTerm, $options: 'i' } },
                        { content: { $regex: searchTerm, $options: 'i' } }
                    ]
                })
                .populate('author', 'name email')
                .sort({ createdAt: -1 })
                .limit(10)
                .lean();

                if (searchResults.length > 0) {
                    await this.setSearchResults(searchTerm, {}, searchResults);
                    warmedCount++;
                }
            }

            // 6. Cache blog statistics for analytics
            logger.info('Warming cache: Blog analytics');
            const now = new Date();
            const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

            const weeklyStats = {
                totalBlogs: await Blog.countDocuments({ 
                    status: 'published', 
                    createdAt: { $gte: lastWeek } 
                }),
                totalUsers: await User.countDocuments({ 
                    createdAt: { $gte: lastWeek } 
                }),
                period: 'week'
            };

            const monthlyStats = {
                totalBlogs: await Blog.countDocuments({ 
                    status: 'published', 
                    createdAt: { $gte: lastMonth } 
                }),
                totalUsers: await User.countDocuments({ 
                    createdAt: { $gte: lastMonth } 
                }),
                period: 'month'
            };

            await this.set('analytics', 'weekly_stats', weeklyStats, 3600); // 1 hour TTL
            await this.set('analytics', 'monthly_stats', monthlyStats, 7200); // 2 hours TTL
            warmedCount += 2;

            logger.info(`Cache warming completed successfully! Warmed ${warmedCount} cache entries`);
            
            return {
                success: true,
                warmedCount,
                categories: {
                    blogs: recentBlogs.length,
                    users: activeUserIds.slice(0, 10).length,
                    searches: popularSearches.length,
                    system: 2,
                    analytics: 2
                }
            };

        } catch (error) {
            logger.error('Cache warming error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Schedule automatic cache warming
     */
    scheduleAutoWarmCache(intervalMinutes = 60) {
        if (this.warmingInterval) {
            clearInterval(this.warmingInterval);
        }

        this.warmingInterval = setInterval(async () => {
            logger.info('Starting scheduled cache warming...');
            const result = await this.warmCache();
            
            if (result.success) {
                logger.info(`Scheduled cache warming completed: ${result.warmedCount} entries`);
            } else {
                logger.error('Scheduled cache warming failed:', result.error);
            }
        }, intervalMinutes * 60 * 1000);

        logger.info(`Automatic cache warming scheduled every ${intervalMinutes} minutes`);
    }

    /**
     * Stop automatic cache warming
     */
    stopAutoWarmCache() {
        if (this.warmingInterval) {
            clearInterval(this.warmingInterval);
            this.warmingInterval = null;
            logger.info('Automatic cache warming stopped');
        }
    }

    /**
     * Health check for cache service
     */
    async healthCheck() {
        try {
            if (!redis.redisClient || redis.redisClient.status !== 'ready') {
                return { status: 'down', message: 'Redis client not connected' };
            }

            const start = Date.now();
            await redis.redisClient.ping();
            const latency = Date.now() - start;

            return {
                status: 'up',
                latency: `${latency}ms`,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'down',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

// Export singleton instance
const cacheService = new CacheService();
module.exports = cacheService;

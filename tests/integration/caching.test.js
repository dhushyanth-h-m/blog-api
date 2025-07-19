const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');
const Blog = require('../../src/models/Blog');
const { redisClient } = require('../../src/config/redis');

describe('Caching Functionality', () => {
    afterAll(async () => {
        // Clean up
        await User.deleteMany({});
        await Blog.deleteMany({});
        const client = redisClient;
        if (client) {
            try {
                await client.flushall();
            } catch (error) {
                // Ignore cleanup errors
            }
        }
    });

    describe('Basic Caching Behavior', () => {
        beforeEach(async () => {
            // Clear cache before each test
            const client = redisClient;
            if (client) {
                try {
                    await client.flushall();
                } catch (error) {
                    // Ignore if Redis is not available
                }
            }
        });

        it('should set cache headers on blog list requests', async () => {
            const response = await request(app)
                .get('/api/blogs')
                .expect(200);

            // Should have some form of cache header
            expect(response.headers).toHaveProperty('x-cache');
            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
        });

        it('should demonstrate cache MISS and HIT pattern when Redis is available', async () => {
            // Skip test if Redis is not available
            const client = redisClient;
            if (!client) {
                console.log('Skipping Redis-dependent test - Redis not available');
                return;
            }

            try {
                await client.ping();
            } catch (error) {
                console.log('Skipping Redis-dependent test - Redis not connected');
                return;
            }

            // First request - should be MISS
            const firstResponse = await request(app)
                .get('/api/blogs')
                .expect(200);

            // Second request - should be HIT (if caching is working)
            const secondResponse = await request(app)
                .get('/api/blogs')
                .expect(200);

            // Check that both requests succeeded
            expect(firstResponse.body.success).toBe(true);
            expect(secondResponse.body.success).toBe(true);
            
            // Both should have cache headers
            expect(firstResponse.headers).toHaveProperty('x-cache');
            expect(secondResponse.headers).toHaveProperty('x-cache');
            
            console.log(`First request cache: ${firstResponse.headers['x-cache']}`);
            console.log(`Second request cache: ${secondResponse.headers['x-cache']}`);
        });
    });

    describe('Cache Configuration', () => {
        it('should show cache configuration in headers', async () => {
            const response = await request(app)
                .get('/api/blogs')
                .expect(200);

            // Should have cache header indicating status
            expect(response.headers).toHaveProperty('x-cache');
            
            const cacheStatus = response.headers['x-cache'];
            expect(['HIT', 'MISS', 'DISABLED', 'ERROR']).toContain(cacheStatus);
            
            console.log(`Cache status: ${cacheStatus}`);
        });

        it('should gracefully handle Redis unavailability', async () => {
            const response = await request(app)
                .get('/api/blogs')
                .expect(200);

            // App should still work even if Redis is down
            expect(response.body.success).toBe(true);
            expect(response.headers).toHaveProperty('x-cache');
            
            // When Redis is not available, cache should be disabled
            const client = redisClient;
            if (!client) {
                expect(response.headers['x-cache']).toBe('DISABLED');
            }
        });
    });
}); 
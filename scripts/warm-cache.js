#!/usr/bin/env node
/**
 * Cache Warming Utility Script
 * Can be run manually or scheduled via cron jobs
 */

// Load environment variables
require('dotenv').config();

const { connectDB } = require('../src/config/database');
const { connectRedis, disconnectRedis } = require('../src/config/redis');
const cacheService = require('../src/services/cacheService');
const logger = require('../src/config/logger');

async function warmCache() {
    try {
        logger.info('=== Manual Cache Warming Started ===');
        
        // Connect to databases
        await connectDB();
        await connectRedis();
        
        // Warm the cache
        const result = await cacheService.warmCache();
        
        if (result.success) {
            logger.info('=== Cache Warming Completed Successfully ===');
            logger.info(`Total entries cached: ${result.warmedCount}`);
            logger.info('Categories cached:');
            Object.entries(result.categories).forEach(([category, count]) => {
                logger.info(`  - ${category}: ${count} entries`);
            });
        } else {
            logger.error('=== Cache Warming Failed ===');
            logger.error(`Error: ${result.error}`);
            process.exit(1);
        }
        
    } catch (error) {
        logger.error('Cache warming script error:', error);
        process.exit(1);
    } finally {
        // Clean up connections
        await disconnectRedis();
        process.exit(0);
    }
}

// Check if running directly (not imported)
if (require.main === module) {
    warmCache();
}

module.exports = { warmCache }; 
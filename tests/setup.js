// Load environment variables for tests
require('dotenv').config();

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { connectRedis, disconnectRedis, redisClient } = require('../src/config/redis');

let mongoServer;

beforeAll(async() => {
    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key';
    
    // Start in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongoServer.getUri();
    await mongoose.connect(process.env.MONGODB_URI);

    // Try to start Redis client (it's optional for tests)
    await connectRedis();
});

afterEach(async () => {
    // Clear database
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }

    // Flush Redis only if it's connected
    if (redisClient) {
        try {
            await redisClient.flushall();
        } catch (error) {
            console.warn('Redis flush error (ignoring):', error.message);
        }
    }
});

afterAll(async() => {
    // Disconnect and stop servers
    await mongoose.disconnect();
    await mongoServer.stop();
    
    // Disconnect Redis if it was connected
    if (disconnectRedis) {
        await disconnectRedis();
    }
});
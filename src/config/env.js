const dotenv = require('dotenv');
const Joi = require('joi');
const path = require('path');

// Load .env file
dotenv.config({
    path: path.resolve(__dirname, '../../.env')
});

const envSchema = Joi.object({
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    PORT: Joi.number().default(3000),
    MONGODB_URI: Joi.string().required().description('MongoDB URI is required'),
    JWT_SECRET: Joi.string().min(32).required().description('JWT secret needs to be at least 32 characters long'),
    JWT_EXPIRES_IN: Joi.string.default('7d'),
    REDIS_URL: Joi.string().description('Redis URL for caching'),
    CORS_ORIGIN: Joi.string().default('http://localhost:3000')
}).unknown();

const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
    throw new Error(`[ENV CONFIG ERROR] : ${error.message}`);
}

module.exports = envVars;
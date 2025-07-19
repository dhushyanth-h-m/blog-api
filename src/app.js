const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
require('dotenv').config();

// Internal imports
const logger = require('./config/logger');
const errorHandler = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');

// Route imports
const authRoutes = require('./routes/auth');
const blogRoutes = require('./routes/blogs');
const userRoutes = require('./routes/users');

// Express app
const app = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    crossOriginEmbedderPolicy: false,
}));

// CORS configuration
const corsOptions = {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};
app.use(cors(corsOptions));

// Compression middleware
app.use(compression());

// Request logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined', {
        stream: {
            write: (message) => logger.info(message.trim()),
        },
    }));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb'}));

// Data sanitization against NoSQL query injection
// app.use(mongoSanitize());

// Rate limiting
app.use('/api/', rateLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Server is running', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version || '1.0.0',
    });
});

// API routes
app.use('/api/auth', authRoutes);
// app.use('/api/blogs', blogRoutes);
app.use('/api/users', userRoutes);

// Welcome route
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to BLOG API', 
        version: '1.0.0',
        documentation: '/api/docs',
        health: '/api/health',
    });
});

// API Documentation route
app.get('/api/docs', (req, res) => {
    res.json({
        message: 'API Documentation',
        version: '1.0.0',
        endpoints: {
            auth: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login', 
                profile: 'GET /api/auth/profile',
                updateProfile: 'PUT /api/auth/profile',
                logout: 'POST /api/auth/logout',
            },
            blogs: {
                getAll: 'GET /api/blogs',
                getById: 'GET /api/blogs/:id',
                create: 'POST /api/blogs',
                update: 'PUT /api/blogs/:id',
                delete: 'DELETE /api/blogs/:id',
                like: 'POST /api/blogs/:id/like',
            },
            users: {
                getAll: 'GET /api/users',
                getById: 'GET /api/users/:id',
                update: 'PUT /api/users/:id',
                delete: 'DELETE /api/users/:id',
            },
        },
    });
});

// // Handle undefined routes
// app.all('*', (req, res) => {
//     res.status(404).json({
//         status: 'error',
//         message: `Route ${req.originalUrl} not found`,
//     });
// });

// Global error handler
// app.use(errorHandler);

module.exports = app;
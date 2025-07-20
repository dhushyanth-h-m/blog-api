# Blog API

A production-ready Node.js blog API with authentication, caching, and comprehensive middleware.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run tests
npm test

# Warm cache
npm run cache:warm
```

## API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `GET /api/blogs` - Get all blogs
- `POST /api/blogs` - Create blog (auth required)
- `GET /api/blogs/cache/stats` - Cache statistics

## Features

- JWT Authentication
- Redis Caching with warming
- Request logging & monitoring
- Security middleware (helmet, rate limiting)
- Docker containerization
- Comprehensive testing

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Cache**: Redis with IORedis
- **Auth**: JWT + bcrypt
- **Testing**: Jest + Supertest

## Environment Variables

Copy `.env.example` to `.env` and configure:
- `MONGODB_URI`
- `REDIS_HOST`
- `JWT_SECRET`

## Docker

```bash
docker-compose up -d
```

---

**Health Check**: `http://localhost:3000/api/health` 
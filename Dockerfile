# Multi-stage build for optimized production image
FROM node:18-alpine AS builder

# Create app directory 
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Production stage
FROM node:18-alpine AS production

# create app directory 
WORKDIR /usr/src/app 

# create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copy package files
COPY package*.json ./

# Copy dependencies from builder stage
COPY --from=builder /usr/src/app/node_modules ./node_modules

# Copy source code
COPY --chown=nodejs:nodejs . .

# create necessary directories
RUN mkdir -p logs uploads && chown -R nodejs:nodejs logs uploads

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD node healthcheck.js

# Start the application
CMD ["node", "server.js"]
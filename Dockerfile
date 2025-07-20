# Mutli-stage build for optimized production image
FROM node:18-alpine AS base

# Install dumb-init for proper signal handling
RUN apk add --no-cache bumb-init

# Create app directory
WORKDIR /usr/src/app

# create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -U 1001

# copy package files 
COPY package*.json ./

# Development stage
FROM base as development 
ENV NODE_ENV=development
RUN npm ci --include=dev
COPY . .
RUN chown -R nodejs:nodejs /usr/src/app
USER nodejs
EXPOSE 3000
CMD ["dumb-init", "npm", "run", "dev"]  

# production dependencies stage
FROM base as deps
ENV NODE_ENV=production
RUN npm ci --only=production && npm cache clean --force

# production stage
FROM base AS production 
ENV NODE_ENV=production

# copy dependencies from deps stage
COPY --from=deps /usr/src/app/node_modules ./node_modules

# copy source code
COPY --chown=nodejs:nodejs . .

# create necessay directories with proper permissions
RUN mkdir -p logs uploads tmp && chown -R nodejs:nodejs logs uploads tmp

# switch to non-root user
USER nodejs

# expose port 
EXPOSE 3000

# health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 CMD node healthcheck.js || exit 1

# use dumb-init for proper signal handling
ENTRYPOINT [ "dump-init", "--" ]
CMD ["node", "server.js"]

# staging stage 
FROM production AS staging
ENV NODE_ENV=staging
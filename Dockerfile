# Multi-stage Dockerfile for ExpenseTracker Backend
# Optimized for production deployment with minimal image size

# Stage 1: Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
# - python3, make, g++ are needed for native dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy prisma schema first for layer caching
COPY prisma ./prisma

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript application
RUN npm run build

# Don't prune - Prisma client is in devDependencies but needed at runtime

# Stage 2: Production stage
FROM node:20-alpine AS production

# Install dumb-init and openssl for Prisma
RUN apk add --no-cache dumb-init openssl

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy production dependencies from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy Prisma files (schema and migrations)
COPY --from=builder /app/prisma ./prisma

# Copy built application
COPY --from=builder /app/build ./build

# Copy environment example (for reference)
COPY .env.example ./

# Copy startup script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Create necessary directories with proper permissions
RUN mkdir -p data logs && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start command
CMD ["./docker-entrypoint.sh"]

# Multi-stage build for backend
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install runtime dependencies for better-sqlite3 and health checks
RUN apk add --no-cache sqlite wget

# Copy package files and install production dependencies only
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Copy migration files (SQL files need to be available)
COPY --from=builder /app/db/migrations ./db/migrations
COPY --from=builder /app/package.json ./

# Expose port
EXPOSE 9000

# Run migrations on startup, then start the application
CMD ["sh", "-c", "node dist/db/migrate.js && node dist/src/index.js"]


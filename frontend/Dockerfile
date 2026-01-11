# Multi-stage build for production
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build arguments (for Vite environment variables)
ARG VITE_API_URL

# Set environment variables for build
ENV VITE_API_URL=${VITE_API_URL}

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Install wget for health checks
RUN apk add --no-cache wget

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]


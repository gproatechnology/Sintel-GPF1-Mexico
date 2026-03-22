# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including devDependencies for build)
RUN npm install --include=dev

# Copy source code
COPY . .

# Build arguments - receive from Render
ARG VITE_API_URL

# Set environment variable for build (default to empty if not provided)
ENV VITE_API_URL=${VITE_API_URL:-}

# Build the application
RUN node ./node_modules/vite/bin/vite.js build

# Production stage
FROM nginx:alpine

# Copy built files from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80 443

# Use entrypoint to configure API URL at runtime
ENTRYPOINT ["/entrypoint.sh"]

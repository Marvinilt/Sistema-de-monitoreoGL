FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first for better caching
COPY package*.json ./
RUN npm ci

# Copy the rest of the application
COPY . .

# Build the TypeScript project
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Copy package info
COPY package*.json ./
# Only install production dependencies
RUN npm ci --omit=dev

# Copy the built output from builder
COPY --from=builder /app/dist ./dist

# Create a data directory to act as a mount point for the volume
RUN mkdir -p /app/data

# Expose backend port
EXPOSE 3001

# Start the application
CMD ["npm", "start"]

# Stage 1: Build the React application
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies needed for node-gyp if necessary
# RUN apk add --no-cache python3 make g++ 

COPY package*.json ./
# Make sure to install all dependencies for Vite build
RUN npm ci

COPY . .

# Build the frontend application
RUN npm run build

# Stage 2: Serve the app with Nginx
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy the built assets from the builder stage
# Vite outputs to dist directory by default
COPY --from=builder /app/dist /usr/share/nginx/html

# Replace the default nginx config with ours
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]

# Use Node.js 20 Alpine as base image (more recent and secure)
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json pnpm-lock.yaml ./

# Install pnpm globally
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build TypeScript
RUN npx tsc

# Expose port
EXPOSE 5000

# Start the application
CMD ["pnpm", "run", "start"]

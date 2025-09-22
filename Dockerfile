# Use Node.js 20
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --production=false

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS release

WORKDIR /app

# Copy built application
COPY --from=build /app/build ./build
COPY --from=build /app/package*.json ./

# Install only production dependencies
RUN npm ci --production

# Set environment
ENV NODE_ENV=production
ENV ORIGIN=http://localhost:3000

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "build/index.js"]

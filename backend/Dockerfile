# Use Node.js LTS
FROM node:20-slim

WORKDIR /app

# Install pnpm
RUN corepack enable pnpm

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --prod --frozen-lockfile

# Copy source code and consumption file
COPY src/ ./src/
COPY consumption.json ./

# Expose backend port
EXPOSE 4000

# Run the app
CMD ["node", "src/index.js"]

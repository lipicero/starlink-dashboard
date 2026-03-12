# Use Node.js LTS
FROM node:20-slim

WORKDIR /app

# Install pnpm
RUN corepack enable pnpm

# Copy workspace configuration and lockfile
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

# Copy backend package file
COPY backend/package.json ./backend/

# Install dependencies for backend
RUN pnpm install --filter backend --prod --frozen-lockfile

# Copy backend source code
COPY backend ./backend

# Set working directory to backend
WORKDIR /app/backend

# Expose backend port
EXPOSE 4000

# Run the app
CMD ["pnpm", "start"]

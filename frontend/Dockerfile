# --- Stage 1: Build ---
FROM node:20-slim AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable pnpm

# Copy workspace configuration and lockfile
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

# Copy frontend package file
COPY frontend/package.json ./frontend/

# Install dependencies for frontend
RUN pnpm install --filter frontend --frozen-lockfile

# Copy frontend source code
COPY frontend ./frontend

# Build the Next.js app
WORKDIR /app/frontend
RUN pnpm run build

# --- Stage 2: Runner ---
FROM node:20-slim AS runner

WORKDIR /app

# Install pnpm (needed to run pnpm start)
RUN corepack enable pnpm

ENV NODE_ENV=production

# Copy necessary files from builder
COPY --from=builder /app/frontend/package.json ./frontend/
COPY --from=builder /app/frontend/.next ./frontend/.next
COPY --from=builder /app/frontend/public ./frontend/public
COPY --from=builder /app/frontend/node_modules ./frontend/node_modules

# Set working directory to frontend
WORKDIR /app/frontend

# Expose frontend port
EXPOSE 3000

# Start Next.js server
CMD ["pnpm", "start"]

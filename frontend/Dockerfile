# --- Stage 1: Build ---
FROM node:20-slim AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable pnpm

# Copy package files
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# Copy source and config files
COPY . .

# Build the Next.js app
RUN pnpm run build

# --- Stage 2: Runner ---
FROM node:20-slim AS runner

WORKDIR /app

# In production, Next.js needs selective files
ENV NODE_ENV=production

# Copy necessary files from builder
COPY --from=builder /app/package.json .
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.ts .

# Expose frontend port
EXPOSE 3000

# Start Next.js server
# Start Next.js server
CMD ["pnpm", "start"]

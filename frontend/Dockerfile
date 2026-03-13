# --- Stage 1: Build ---
FROM node:20-slim AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable pnpm

# Copy workspace configuration and lockfile
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

# Copy frontend package file
COPY frontend/package.json ./frontend/

# Install ALL dependencies (needed for build)
RUN pnpm install --filter frontend --frozen-lockfile

# Copy frontend source code
COPY frontend ./frontend

# Build the Next.js app (generates .next/standalone)
WORKDIR /app/frontend
RUN pnpm run build

# --- Stage 2: Runner ---
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy the standalone output (includes its own node_modules tree)
COPY --from=builder /app/frontend/.next/standalone ./
COPY --from=builder /app/frontend/.next/static ./frontend/.next/static
COPY --from=builder /app/frontend/public ./frontend/public

EXPOSE 3000

# next start in standalone mode — no pnpm/npm needed
CMD ["node", "frontend/server.js"]

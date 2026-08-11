# syntax=docker/dockerfile:1

# Base image
ARG NODE_VERSION=22
FROM node:${NODE_VERSION}-slim AS base
WORKDIR /app
ENV NODE_ENV=production

# Install dependencies (workspace-aware)
FROM base AS deps
RUN apt-get update -qq \
  && apt-get install --no-install-recommends -y build-essential node-gyp pkg-config python-is-python3 \
  && rm -rf /var/lib/apt/lists/*

# Copy manifests so npm can install all workspaces (backend + shared)
COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/
COPY packages/shared/package.json packages/shared/
RUN npm ci --include=dev

# Build shared + backend only
FROM deps AS build
COPY . .
# Placeholder DB URLs so prisma generate works at build time
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db" \
    SHADOW_DATABASE_URL="postgresql://user:pass@localhost:5432/shadow"
RUN rm -rf apps/backend/dist packages/shared/dist \
  && rm -f apps/backend/tsconfig.tsbuildinfo packages/shared/tsconfig.tsbuildinfo \
  && npm run build --workspace=shared \
  && npm run build --workspace=backend

# Runtime image
FROM base AS runner
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/
COPY packages/shared/package.json packages/shared/
RUN npm ci --omit=dev

# Copy self-contained build artifacts
COPY --from=build /app/packages/shared/dist packages/shared/dist
COPY --from=build /app/apps/backend/dist apps/backend/dist

WORKDIR /app/apps/backend
ENV PORT=8080
EXPOSE 8080

CMD ["node", "dist/src/server.js"]

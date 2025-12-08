FROM node:20-slim AS build
WORKDIR /app

# Install root and workspace dependencies
COPY package*.json ./
COPY apps/backend/package*.json apps/backend/
COPY packages/shared/package*.json packages/shared/
RUN npm ci

# Copy the full repo and build workspaces
COPY . .
# Provide a placeholder DB URL so Prisma generate succeeds at build time
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"
RUN npm run prisma:generate --workspace=backend \
  && npm run build --workspace=shared \
  && npm run build --workspace=backend

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install production dependencies
COPY package*.json ./
COPY apps/backend/package*.json apps/backend/
COPY packages/shared/package*.json packages/shared/
RUN npm ci --omit=dev

# Bring in built artifacts
COPY --from=build /app/apps/backend/prisma apps/backend/prisma
COPY --from=build /app/packages/shared/dist packages/shared/dist
COPY --from=build /app/apps/backend/dist apps/backend/dist

WORKDIR /app/apps/backend
ENV PORT=8080
EXPOSE 8080

CMD ["node", "dist/server.js"]

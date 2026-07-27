# Multi-stage build para producción

# Stage 1: Construcción
FROM node:22-alpine AS builder

WORKDIR /app

# Solo para compilar dependencias nativas si las hubiera (typeorm, better-sqlite3)
RUN apk add --no-cache python3 make g++

COPY package*.json tsconfig.json vite.config.ts index.html ./
RUN npm ci

COPY src/ ./src/
COPY tests/ ./tests/

RUN npm run build

# Stage 2: Producción
FROM node:22-alpine

WORKDIR /app

# tini para manejo correcto de señales y reaping de zombies
RUN apk add --no-cache tini wget
ENV TINI_VERSION=v0.19.0

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

RUN npm ci --omit=dev --ignore-scripts \
 && chown -R node:node /app \
 && chmod -R 750 /app

USER node

ENV NODE_ENV=production

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/index.js"]

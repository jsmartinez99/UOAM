# Multi-stage build para producción

# Stage 1: Construcción
FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json tsconfig.json vite.config.ts index.html ./
RUN npm ci

COPY src/ ./src/
COPY tests/ ./tests/

RUN npm run build

# Stage 2: Producción
FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++

# Copiamos solo los archivos necesarios
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

RUN npm ci --omit=dev

# Configuración de seguridad
RUN chown -R node:node /app && chmod -R 750 /app
USER node

# Variables de entorno
ENV NODE_ENV=production
ENV QDRANT_URL=http://qdrant:6333

# Puerto de exposición
EXPOSE 3000

# Comando de inicio
CMD ["node", "dist/index.js"]

# Multi-stage build para producción

# Stage 1: Construcción
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src/ ./src/
COPY tests/ ./tests/

RUN npm run build

# Stage 2: Producción
FROM node:18-alpine

WORKDIR /app

# Copiamos solo los archivos necesarios
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

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

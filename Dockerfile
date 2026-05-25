# Build stage — compile Vite frontend
FROM node:20-alpine AS build

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# App stage — lean production image
FROM node:20-alpine AS app

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001 -G nodejs

COPY --from=build --chown=appuser:nodejs /app/dist ./dist
COPY --from=build --chown=appuser:nodejs /app/server.js ./
COPY --from=build --chown=appuser:nodejs /app/package*.json ./
COPY --from=build --chown=appuser:nodejs /app/node_modules ./node_modules

RUN mkdir -p /app/characters && chown appuser:nodejs /app/characters

USER appuser

EXPOSE 3000

CMD ["node", "server.js"]

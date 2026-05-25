# Build stage — compile Vite frontend
FROM node:22-alpine AS build

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

# VITE_ vars must be present at build time so Vite embeds them in the bundle
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}

COPY . .
RUN npm run build

# App stage — lean production image (Express serves built dist/)
FROM node:22-alpine AS app

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001 -G nodejs

COPY --from=build --chown=appuser:nodejs /app/dist ./dist
COPY --from=build --chown=appuser:nodejs /app/server.js ./
COPY --from=build --chown=appuser:nodejs /app/package*.json ./
COPY --from=build --chown=appuser:nodejs /app/node_modules ./node_modules

USER appuser

EXPOSE 3000

CMD ["node", "server.js"]

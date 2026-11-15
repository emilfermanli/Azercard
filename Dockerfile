# syntax=docker/dockerfile:1.7
# ---------------------------------------------------------------------------
# Azericard Reporting Platform — production image
#   stage 1: Node 22  → `tsc && vite build`  → /app/dist
#   stage 2: nginx    → serves /dist (SPA) + reverse-proxies /api/ to backend
# ---------------------------------------------------------------------------

########################  1. BUILD  ########################
FROM node:22-alpine AS build

WORKDIR /app

# Build-time (baked into bundle by Vite). Override via `--build-arg` or compose.
#   VITE_APP_API   → "/api/" keeps same-origin; nginx proxies it to API_UPSTREAM
#   VITE_PERSIST_KEY → redux-persist encryption key
#   VITE_CARTO_BASEMAP_KEY → CARTO Basemaps key for the map pages
ARG VITE_APP_API=/api/
ARG VITE_PERSIST_KEY=change-me-in-.env
ARG VITE_CARTO_BASEMAP_KEY=
ENV VITE_APP_API=${VITE_APP_API} \
    VITE_PERSIST_KEY=${VITE_PERSIST_KEY} \
    VITE_CARTO_BASEMAP_KEY=${VITE_CARTO_BASEMAP_KEY} \
    GENERATE_SOURCEMAP=false \
    HUSKY=0 \
    NODE_OPTIONS=--max-old-space-size=4096

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund

COPY . .
RUN npm run build

########################  2. RUNTIME  ########################
FROM nginx:1.27-alpine AS runtime

# Runtime env consumed by nginx's built-in envsubst (templates → conf.d)
#   API_UPSTREAM  → backend origin, e.g. http://31.57.77.199:8080
#   SERVER_NAME   → hostname (default `_` = any)
ENV API_UPSTREAM=http://31.57.77.199:8080 \
    SERVER_NAME=_

RUN rm -f /etc/nginx/conf.d/default.conf
COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]

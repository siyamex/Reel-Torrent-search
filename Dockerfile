# All-in-one image: backend + frontend (served by nginx) + Redis, all in a
# single container. Simpler to run (one `docker run`, one port) at the cost
# of losing the ability to scale/restart each piece independently — the
# per-service images (backend/Dockerfile, frontend/Dockerfile) plus
# docker-compose.yml are the better choice if that ever matters. For a
# single small home-server deployment (e.g. CasaOS on a Pi), this is easier.

# --- Backend build ---
FROM node:20-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/tsconfig.json ./
COPY backend/src ./src
RUN npm run build

# --- Frontend build ---
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# --- Runtime ---
FROM node:20-alpine AS runtime
# gettext provides envsubst, used to template the nginx port at startup —
# Alpine's plain nginx package (unlike the official nginx:*-alpine image)
# has no built-in envsubst-on-templates entrypoint.
RUN apk add --no-cache nginx supervisor redis gettext

WORKDIR /app/backend
COPY --from=backend-build /app/backend/dist ./dist
COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY --from=frontend-build /app/frontend/dist /usr/share/nginx/html

COPY docker/nginx.allinone.conf.template /etc/nginx/http.d/default.conf.template
COPY docker/supervisord.conf /etc/supervisord.conf
COPY docker/start-nginx.sh /usr/local/bin/start-nginx.sh
RUN chmod +x /usr/local/bin/start-nginx.sh

ENV NODE_ENV=production
ENV PORT=4000
# Redis runs inside this same container, bound to localhost only — not
# reachable from outside, so no separate credentials/exposure to worry about.
ENV REDIS_URL=redis://127.0.0.1:6379
# The port nginx listens on INSIDE the container. Override with -e if your
# platform's UI won't let two containers both claim container-port 80 (e.g.
# CasaOS) — just make sure it matches whatever "Container" port you map.
ENV HTTP_PORT=80

EXPOSE 80
VOLUME ["/data"]

CMD ["supervisord", "-c", "/etc/supervisord.conf"]

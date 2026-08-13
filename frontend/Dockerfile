FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Default matches the "backend" service name from docker-compose.yml /
# docker-compose.casaos.yml. Override with -e BACKEND_HOST=host:port when
# running standalone (e.g. CasaOS manual install) without Compose networking.
ENV BACKEND_HOST=backend:4000

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

#!/bin/sh
set -e

# Alpine's plain `nginx` package (unlike the official nginx:*-alpine image)
# has no built-in envsubst-on-templates entrypoint, so this does it manually
# before handing off to nginx itself.
envsubst '${HTTP_PORT}' < /etc/nginx/http.d/default.conf.template > /etc/nginx/http.d/default.conf

exec nginx -g "daemon off;"

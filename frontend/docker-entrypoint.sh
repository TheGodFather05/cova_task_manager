#!/bin/sh
set -e

# Cloud Run sets PORT; locally it defaults to 80
export PORT="${PORT:-80}"
# BACKEND_URL is the Cloud Run backend service; compose uses the service name
export BACKEND_URL="${BACKEND_URL:-http://backend:8080}"
# nginx needs the bare host for the Host header, or Cloud Run routes to the wrong service
export BACKEND_HOST="$(printf '%s' "$BACKEND_URL" | sed -e 's|^https\{0,1\}://||' -e 's|/.*$||')"

envsubst '${PORT} ${BACKEND_URL} ${BACKEND_HOST}' \
  < /etc/nginx/templates/default.conf.template \
  > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'

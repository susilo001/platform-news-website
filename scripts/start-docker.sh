#!/bin/sh
set -eu

# Render Free Docker services have no pre-deploy command. Use runtime secrets,
# never Docker build arguments, for database preparation. Abort on any failure.
if [ "${DEMO_MODE:-false}" != "true" ]; then
  npm run db:migrate
  npm run db:seed
fi

exec node server.js

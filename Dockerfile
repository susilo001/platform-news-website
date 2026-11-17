FROM node:22-bookworm-slim AS build
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
# Build with --target worker for the separate publishing process.
FROM build AS worker
ENV NODE_ENV=production
USER node
CMD ["npm","run","worker"]
FROM build AS production-deps
RUN npm prune --omit=dev --ignore-scripts
FROM node:22-bookworm-slim AS web
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=production-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --from=build --chown=node:node /app/src/modules/articles/demo.ts ./src/modules/articles/demo.ts
COPY --from=build --chown=node:node /app/scripts/start-docker.sh ./scripts/start-docker.sh
USER node
EXPOSE 3000
CMD ["sh","scripts/start-docker.sh"]

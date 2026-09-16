FROM node:24.14.0-alpine3.23 AS builder
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
COPY db ./db
RUN npm run build
RUN npm prune --omit=dev

FROM node:24.14.0-alpine3.23 AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN apk add --no-cache sqlite-libs \
    && mkdir -p /app/data /app/logs \
    && chown -R node:node /app
COPY package.json package-lock.json ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/db/migrations ./db/migrations
USER node
EXPOSE 9000
CMD ["node", "dist/src/index.js"]

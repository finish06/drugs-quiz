FROM node:22-alpine AS build

ARG GIT_COMMIT=dev
ARG GIT_BRANCH=dev
ARG BUILD_TIME=

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN GIT_COMMIT=$GIT_COMMIT GIT_BRANCH=$GIT_BRANCH BUILD_TIME=${BUILD_TIME:-$(date -u +%Y-%m-%dT%H:%M:%SZ)} npx tsx scripts/generate-build-info.ts
RUN npx tsc

FROM node:22-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/drizzle ./drizzle

EXPOSE 3001
CMD ["node", "dist/index.js"]

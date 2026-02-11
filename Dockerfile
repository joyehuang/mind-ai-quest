# syntax=docker/dockerfile:1.6
FROM node:20-bullseye-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ARG NPM_REGISTRY=https://registry.npmmirror.com
ENV COREPACK_NPM_REGISTRY=$NPM_REGISTRY
ENV npm_config_registry=$NPM_REGISTRY

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN corepack enable \
  && corepack prepare pnpm@10.29.2 --activate \
  && pnpm config set registry $NPM_REGISTRY \
  && pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable && pnpm build

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=7860
ENV HOSTNAME=0.0.0.0
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 7860
CMD ["node_modules/.bin/next", "start", "-p", "7860", "-H", "0.0.0.0"]

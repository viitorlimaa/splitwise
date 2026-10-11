FROM node:20-alpine AS base

RUN corepack enable && corepack prepare pnpm@12.4.1 --activate
WORKDIR /usr/src/app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .
RUN pnpm prisma generate
RUN pnpm build

FROM node:20-alpine AS runner
RUN corepack enable && corepack prepare pnpm@12.4.1 --activate
WORKDIR /usr/src/app

ENV NODE_ENV=production \
    PORT=3000

COPY --from=build /usr/src/app/package.json ./package.json
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/prisma ./prisma
COPY --from=build /usr/src/app/src/generated ./src/generated

EXPOSE 3000
CMD ["pnpm", "start:prod"]

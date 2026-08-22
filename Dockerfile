FROM oven/bun:1.2.23-debian AS base

ENV NODE_ENV=production

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl sqlite3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /myapp

FROM base AS deps

ENV NODE_ENV=development

COPY package.json bun.lock ./
COPY prisma ./prisma
RUN bun install --frozen-lockfile

FROM deps AS build

ENV DATABASE_URL=file:/tmp/notes.db

COPY . .
RUN bun run build
RUN test -f dist/server/server.js

FROM base AS production-deps

COPY package.json bun.lock ./
COPY prisma ./prisma
RUN bun install --production --frozen-lockfile

FROM base AS runtime

ENV DATABASE_URL=file:/myapp/data/notes.db
ENV PORT=8080

COPY --from=production-deps /myapp/node_modules ./node_modules
COPY --from=build /myapp/dist ./dist
COPY --from=build /myapp/prisma ./prisma
COPY --from=build /myapp/package.json ./package.json
COPY --from=build /myapp/server.js ./server.js
COPY --from=build /myapp/start.sh ./start.sh

RUN chmod +x ./start.sh \
    && printf '%s\n' '#!/bin/sh' 'exec sqlite3 "${DATABASE_URL#file:}"' > /usr/local/bin/database-cli \
    && chmod +x /usr/local/bin/database-cli

EXPOSE 8080

ENTRYPOINT ["./start.sh"]

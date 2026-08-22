#!/bin/sh
set -eu

bunx prisma migrate deploy
bun run seed
exec bun server.js

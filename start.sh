#!/bin/sh
set -eu

bunx prisma migrate deploy
exec bun server.js

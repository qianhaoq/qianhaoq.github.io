#!/usr/bin/env bash
set -euo pipefail

node --version
corepack enable
corepack prepare pnpm@10.12.1 --activate
pnpm --version
pnpm install --frozen-lockfile
pnpm exec playwright install --with-deps chrome
pnpm quality:pr

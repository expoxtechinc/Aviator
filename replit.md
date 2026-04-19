# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

### Aviator Game (`artifacts/aviator-game`)
- Mobile-first crash game (Aviator-style)
- React + Vite + Tailwind CSS
- Preview path: `/`
- Features:
  - Real-time crash multiplier graph (canvas-based)
  - Animated SVG plane with exhaust trail
  - Manual bet + auto cashout
  - Auto bet mode
  - Live bets panel with simulated players
  - Crash history bar
  - Stats tracking (wins/losses/balance)
  - Stars background animation

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/aviator-game run dev` — run Aviator game locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

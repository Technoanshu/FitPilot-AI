# FitPilot AI

FitPilot AI is a premium gym management command center for owners and coaches to understand operations, manage members, coordinate classes, monitor attendance, and act on AI-assisted insights.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/fitpilot-ai/src/` — React application shell, layout, pages, forms, theme provider, and UI primitives
- `lib/api-spec/openapi.yaml` — source of truth for FitPilot API contracts
- `artifacts/api-server/src/routes/fitpilot.ts` — FitPilot API routes
- `artifacts/api-server/src/lib/fitpilot-seed.ts` — first-run seed data
- `lib/db/src/schema/gym.ts` — persistent gym data model
- `artifacts/fitpilot-ai/src/index.css` — shared light/dark theme tokens

## Architecture decisions

- The frontend consumes generated OpenAPI hooks from `@workspace/api-client-react` rather than hand-written fetch types.
- Gym records are persisted in the shared PostgreSQL database and are seeded only when the FitPilot tables are empty.
- The app uses a focused operational shell with route-level pages for dashboard, members, schedule, attendance, and insights.
- Theme state is stored locally so each operator's light/dark preference persists between sessions.

## Product

- Dashboard command center with live KPI cards, attendance trend, and recent activity.
- Searchable member directory with status filters and add/edit flows.
- Upcoming class schedule with capacity tracking and class creation.
- Attendance view with manual check-ins that update member and activity data.
- AI-assisted insight feed for retention, class capacity, and growth opportunities.
- Responsive layout and light/dark mode.

## User preferences

- Premium startup-quality product experience inspired by Linear, Stripe, Notion, Framer, and Vercel.
- Avoid generic or dummy-looking UI; prioritize polished, functional flows.

## Gotchas

- After changing `lib/api-spec/openapi.yaml`, run `pnpm --filter @workspace/api-spec run codegen`.
- Verify both `pnpm --filter @workspace/api-server run typecheck` and `pnpm --filter @workspace/fitpilot-ai run typecheck` after API or UI changes.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details

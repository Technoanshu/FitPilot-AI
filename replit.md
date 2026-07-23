# FitPilot AI

FitPilot AI is an AI-powered gym management and personal fitness platform for gym owners, coaches, and members.

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

- `artifacts/fitpilot-ai/src/components/` — reusable UI and layout components
- `artifacts/fitpilot-ai/src/pages/` — route-level product surfaces
- `artifacts/fitpilot-ai/src/layouts/` — layout exports and shell composition
- `artifacts/fitpilot-ai/src/hooks/` — feature hooks and shared helpers
- `artifacts/fitpilot-ai/src/contexts/` — shared context exports
- `artifacts/fitpilot-ai/src/services/` — API service boundaries
- `artifacts/fitpilot-ai/src/types/` — shared frontend types
- `artifacts/fitpilot-ai/src/utils/` — shared pure utilities
- `artifacts/fitpilot-ai/src/assets/` — app-owned asset location
- `lib/api-spec/openapi.yaml` — source of truth for FitPilot API contracts
- `artifacts/api-server/src/routes/fitpilot.ts` — FitPilot API routes
- `artifacts/api-server/src/lib/fitpilot-seed.ts` — first-run seed data for the fresh fp_* model
- `lib/db/src/schema/fitpilot.ts` — persistent gym and fitness data model
- `artifacts/fitpilot-ai/src/index.css` — shared light/dark theme tokens

## Architecture decisions

- The frontend consumes generated OpenAPI hooks from `@workspace/api-client-react` rather than hand-written fetch types.
- React Router owns route composition and nested layout rendering.
- Gym and personal-fitness records use a fresh `fp_*` table namespace so this rebuild is isolated from the previous model.
- The app uses a focused operational shell with route-level pages for overview, members, member profiles, programs, schedule, attendance, and insights.
- Theme state is stored locally so each operator's light/dark preference persists between sessions.

## Product

- Dashboard overview with live KPI cards, attendance trend, and recent activity.
- Searchable member directory with status filters, add flow, and profile editing.
- Member profile with goal, plan, timeline, and progress context.
- Training program library with program creation.
- Upcoming class schedule with capacity tracking and class creation.
- Attendance history with manual check-ins that update member and activity data.
- AI-assisted insight feed for retention, class capacity, and growth opportunities.
- Responsive layout and light/dark mode.

## User preferences

- Production-ready SaaS architecture with clean folder boundaries.
- Avoid generic or dummy-looking UI; prioritize polished, functional flows.

## Gotchas

- After changing `lib/api-spec/openapi.yaml`, run `pnpm --filter @workspace/api-spec run codegen`.
- Verify both `pnpm --filter @workspace/api-server run typecheck` and `pnpm --filter @workspace/fitpilot-ai run typecheck` after API or UI changes.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details

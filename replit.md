# FitPilot AI

FitPilot AI is a production-ready SaaS gym management platform. Gym owners sign in, create members, schedule classes, track attendance, build training programs, and act on AI-powered insights. All data is read from and written to Supabase — no seed data, no mock data.

## Run & Operate

- `pnpm --filter @workspace/fitpilot-ai run dev` — frontend dev server
- `pnpm --filter @workspace/api-server run dev` — API server (health route only; app data goes through Supabase directly)
- `pnpm --filter @workspace/fitpilot-ai run typecheck` — TypeScript check

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19, Vite 7, React Router 7, TanStack Query, React Hook Form, Zod, Tailwind CSS, shadcn/ui
- Backend-as-a-Service: Supabase (PostgreSQL, Auth, Storage, RLS)

## Supabase Project

- **Project URL:** `https://tlmnopuwyotjhbkzzomi.supabase.co`
- **Migration:** `artifacts/fitpilot-ai/supabase/migrations/202607230001_fitpilot.sql`  
  Run this once in Supabase Dashboard → SQL Editor to create all tables, indexes, triggers, RLS policies, and the `member-avatars` storage bucket.

## Environment Variables

| Key | Where set | Purpose |
|-----|-----------|---------|
| `VITE_SUPABASE_URL` | Replit shared env | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Replit shared env | Public anon/publishable key |

## Where things live

```
artifacts/fitpilot-ai/src/
  lib/supabase/
    client.ts          — createClient singleton, isSupabaseConfigured guard
    types.ts           — shared TypeScript interfaces for all entities
  services/supabase/
    auth.ts            — signIn / signUp / signOut / resetPassword / subscribeToAuth
    queries.ts         — TanStack Query hooks for all features (members, programs, classes, checkins, activity, insights, dashboard)
    storage.ts         — uploadMemberAvatar / createMemberAvatarUrl / deleteMemberAvatar
    index.ts           — re-exports
  contexts/
    supabase-auth.tsx  — SupabaseAuthProvider + useSupabaseAuth hook
  pages/
    Auth.tsx           — sign-in / sign-up screen
    Dashboard.tsx      — live KPI cards, attendance trend, activity feed
    Members.tsx        — searchable member directory
    MemberProfile.tsx  — individual member detail + edit
    Programs.tsx       — training program library
    Schedule.tsx       — class schedule with capacity tracking
    Attendance.tsx     — check-in log + manual check-in
    Insights.tsx       — AI-powered operational signals
  supabase/migrations/
    202607230001_fitpilot.sql  — full schema + RLS + storage
```

## Architecture decisions

- Every feature reads and writes through Supabase directly from the browser — no separate backend layer for application data.
- Auth is handled by Supabase Auth (email/password). Sessions are persisted in localStorage and auto-refreshed.
- Row Level Security ensures each gym account (`owner_id = auth.uid()`) can only access its own rows. No shared data between accounts.
- The `profiles` table is auto-populated by a `handle_new_user` trigger on `auth.users` insert.
- `VITE_` prefix env vars are exposed to the Vite build; the anon key is safe to expose since RLS enforces access control.
- The old Express API / Drizzle / fp_* tables are still present as a health-check server but no longer serve application data.

## Product features

- **Auth gate** — unauthenticated users see the sign-in/sign-up screen; authenticated users land on the dashboard.
- **Dashboard** — live member count, check-ins today, program/class counts; 14-day attendance trend chart; recent activity feed.
- **Members** — searchable by name/email/phone; filterable by status; add member form; click-through to full profile with edit.
- **Member Profile** — goal, plan, status, visit history; inline edit dialog.
- **Programs** — training program cards with level/duration/sessions; create form.
- **Schedule** — upcoming classes with capacity bar; create class form.
- **Attendance** — check-in log; manual check-in dialog linked to active members.
- **Insights** — operational signal cards with priority, summary, metric, and recommended action.
- **Storage** — member avatar uploads stored in the private `member-avatars` bucket with signed URLs.
- **Dark/light mode** — persisted per device in localStorage.

## User preferences

- Production-quality SaaS; no seed data or mock fallbacks.
- Premium UI aesthetic inspired by Linear, Stripe, Notion, Framer, Vercel.

## Gotchas

- Run the SQL migration in Supabase before the app will show real data (tables must exist for queries to succeed).
- After changing frontend code, `pnpm --filter @workspace/fitpilot-ai run typecheck` must pass.
- `VITE_SUPABASE_URL` must be a valid `https://` URL, not the publishable key string.
- Storage RLS policies scope paths to `{owner_id}/{member_id}/{uuid}.ext` — upload paths must match this structure.

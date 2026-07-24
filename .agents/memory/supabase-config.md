---
name: FitPilot Supabase Configuration
description: Supabase project details, env var setup, and migration steps for FitPilot AI
---

# FitPilot Supabase Configuration

## Project

- **URL:** `https://tlmnopuwyotjhbkzzomi.supabase.co`
- **Project ref:** `tlmnopuwyotjhbkzzomi` (extracted from anon key JWT `ref` field)
- **Anon key JWT:** issued 2024, expires 2100; stored in Replit shared env

## Env Vars (Replit shared environment)

- `VITE_SUPABASE_URL` = `https://tlmnopuwyotjhbkzzomi.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = JWT starting with `eyJhbGci...`

**Why:** The VITE_ prefix is required for Vite to expose them to the browser via `import.meta.env`.
**Watch out:** At setup the URL was mistakenly set to the publishable key string (`sb_publishable_...`) rather than the HTTPS URL. Always decode the JWT `ref` field to derive the correct URL if it goes missing.

## Migration

File: `artifacts/fitpilot-ai/supabase/migrations/202607230001_fitpilot.sql`
Run once in Supabase Dashboard → SQL Editor. Creates:
- `profiles`, `members`, `programs`, `classes`, `checkins`, `activity`, `insights` tables
- RLS policies scoping all rows to `owner_id = auth.uid()`
- `handle_new_user` trigger auto-creating profile on signup
- `member-avatars` private storage bucket with RLS

## Auth

Email/password via Supabase Auth. Sessions persisted in localStorage, auto-refreshed.
`SupabaseAuthProvider` in `contexts/supabase-auth.tsx` tracks session state across the app.
Auth gate in `App.tsx` shows `Auth.tsx` if `!session`.

## Tables (query layer)

All queries in `services/supabase/queries.ts`. All calls go directly from browser to Supabase — no custom API layer. Every query calls `getCurrentUserId()` first to enforce auth.

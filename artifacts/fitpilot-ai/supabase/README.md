# FitPilot AI — Supabase Setup

## Run this migration once in your Supabase project

1. Open your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your **fitpilot-ai** project
3. Go to **SQL Editor**
4. Open the file `supabase/migrations/202607230001_fitpilot.sql` in this repo
5. Paste the full contents into the editor and click **Run**

This creates:
- `profiles` — auto-created on signup via trigger
- `members` — gym members with plan, status, goal
- `programs` — training programs
- `classes` — scheduled class sessions
- `checkins` — member attendance log
- `activity` — gym operations activity feed
- `insights` — AI-generated operational insights

All tables have **Row Level Security** enabled. Every row is scoped to `owner_id = auth.uid()`, so each gym account only sees its own data.

## Storage

A private `member-avatars` bucket is created by the migration. RLS policies restrict each user to their own `{user_id}/` prefix.

## Auth

Email/password auth is used. Enable it in:
**Authentication → Providers → Email** (should be on by default).

## Environment variables (already set in Replit)

```
VITE_SUPABASE_URL=https://tlmnopuwyotjhbkzzomi.supabase.co
VITE_SUPABASE_ANON_KEY=<your anon key>
```

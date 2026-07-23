/**
 * Supabase is the application data boundary.
 *
 * Feature queries live in services/supabase and use the browser client with
 * authenticated RLS. This module remains as a stable service namespace for
 * future non-Supabase integrations without reintroducing mock or API data.
 */
export const dataProvider = "supabase" as const;
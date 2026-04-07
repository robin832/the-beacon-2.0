import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: 'innovation' },
});

// Client for public schema queries (used in edge functions, not directly from browser)
export const supabasePublic = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: 'public' },
});

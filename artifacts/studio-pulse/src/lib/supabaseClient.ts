// Supabase is optional — presenter mode / realtime requires it.
// Without credentials the client is null and consumers handle gracefully.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL ?? '';
const key = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

export const supabase: SupabaseClient | null =
  url && key && !url.includes('your-project')
    ? createClient(url, key)
    : null;

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase env vars are missing; set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export function getSupabaseClient() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.');
  }
  return supabase;
}

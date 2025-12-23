import { createClient } from '@supabase/supabase-js';

// Provided project defaults (fallback if env is not set)
const fallbackUrl = 'https://bgqfxleuxgmvqmitfrce.supabase.co';
const fallbackAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJncWZ4bGV1eGdtdnFtaXRmcmNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0Njg5ODUsImV4cCI6MjA4MjA0NDk4NX0.cV_jm4fnWRCJMxTXt1E6tkQNswBdSA9-UXsl-kWTk0Q';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || fallbackUrl;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || fallbackAnonKey;

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('Supabase env vars missing; using provided fallback URL/key. Add them to .env for production.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function getSupabaseClient() {
  return supabase;
}
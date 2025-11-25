import { createClient } from '@supabase/supabase-js';

// Helper para buscar variáveis em diferentes ambientes e garantir fallback
const getEnvVar = (keys: string[]) => {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    for (const key of keys) {
      // @ts-ignore
      if (import.meta.env[key]) return import.meta.env[key];
    }
  }
  if (typeof process !== 'undefined' && process.env) {
    for (const key of keys) {
      if (process.env[key]) return process.env[key];
    }
  }
  return undefined;
};

// Fallbacks explícitos para garantir funcionamento se as vars falharem
const supabaseUrl = getEnvVar(['VITE_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'REACT_APP_SUPABASE_URL']) || "https://eihygwahxhzbrnvxecfm.supabase.co";
const supabaseAnonKey = getEnvVar(['VITE_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'REACT_APP_SUPABASE_ANON_KEY']) || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpaHlnd2FoeGh6YnJudnhlY2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMDM5MTgsImV4cCI6MjA3OTU3OTkxOH0.nYLOyQweIDccATp6OpLhXFVB-DtMygeHSASJl47Xru8";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined
  }
});
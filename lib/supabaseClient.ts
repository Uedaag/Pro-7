import { createClient } from '@supabase/supabase-js';

// Função auxiliar para buscar variáveis em diferentes ambientes (Vite, Next.js, CRA)
const getEnvVar = (keys: string[]): string | undefined => {
  // 1. Tenta process.env (Node/CRA/Next.js)
  if (typeof process !== 'undefined' && process.env) {
    for (const key of keys) {
      if (process.env[key]) return process.env[key];
    }
  }

  // 2. Tenta import.meta.env (Vite)
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    for (const key of keys) {
      // @ts-ignore
      if (import.meta.env[key]) return import.meta.env[key];
    }
  }

  return undefined;
};

// Tenta encontrar a URL e a Key em diversas variações de nome
const supabaseUrl = getEnvVar([
  'NEXT_PUBLIC_SUPABASE_URL', 
  'VITE_SUPABASE_URL', 
  'REACT_APP_SUPABASE_URL',
  'SUPABASE_URL'
]) || "https://eihygwahxhzbrnvxecfm.supabase.co"; // Fallback explícito do seu projeto

const supabaseKey = getEnvVar([
  'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
  'VITE_SUPABASE_ANON_KEY', 
  'REACT_APP_SUPABASE_ANON_KEY',
  'SUPABASE_ANON_KEY'
]) || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpaHlnd2FoeGh6YnJudnhlY2ZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMDM5MTgsImV4cCI6MjA3OTU3OTkxOH0.nYLOyQweIDccATp6OpLhXFVB-DtMygeHSASJl47Xru8"; // Fallback explícito do seu projeto

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase Credentials Missing!');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
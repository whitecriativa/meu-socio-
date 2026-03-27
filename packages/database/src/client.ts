import { createClient, type SupabaseClient } from '@supabase/supabase-js'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Variavel de ambiente ausente: ${name}`)
  return value
}

// Cliente para o browser / server-side com anon key — respeita RLS
export function createBrowserClient(): SupabaseClient {
  return createClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  )
}

// Cliente server-side com service role — BYPASSA RLS
// Usar APENAS em operacoes do sistema (n8n, cron, webhooks)
// NUNCA expor no frontend
export function createServiceClient(): SupabaseClient {
  return createClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}

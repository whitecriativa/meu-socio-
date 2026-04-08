-- Migration 009: limpar "Cliente" genérico nos agendamentos antigos
-- Agendamentos onde notes = 'Cliente' (bot antigo) ficam com notes = NULL
UPDATE public.appointments
SET notes = NULL
WHERE LOWER(TRIM(notes)) IN ('cliente', 'sem nome', 'amigo', 'user', 'usuario');

-- Garante que as colunas da migration 005 existem (idempotente)
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS client_name  TEXT,
  ADD COLUMN IF NOT EXISTS client_phone TEXT;

-- Garante que avatar_url existe (migration 008)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Cria bucket avatars se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

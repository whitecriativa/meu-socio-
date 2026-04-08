-- ============================================================
-- Migration 005: Autoagendamento público
-- Adiciona campos de booking ao users e tabela de slots bloqueados
-- ============================================================

-- Campos no users para autoagendamento
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS booking_slug        TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS booking_active      BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS booking_services    JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS booking_days        INTEGER[] DEFAULT '{1,2,3,4,5}'::integer[];
-- booking_days: 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sab

-- Índice para busca por slug (rota pública)
CREATE UNIQUE INDEX IF NOT EXISTS users_booking_slug_idx ON users(booking_slug)
  WHERE booking_slug IS NOT NULL;

-- A tabela appointments já existe. Garantir coluna client_name e client_phone
-- para agendamentos feitos por clientes sem cadastro no sistema.
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS client_name  TEXT,
  ADD COLUMN IF NOT EXISTS client_phone TEXT,
  ADD COLUMN IF NOT EXISTS booked_via   TEXT DEFAULT 'manual';
-- booked_via: 'manual' | 'bot' | 'autoagendamento'

-- ============================================================
-- RLS: booking público (leitura do perfil do profissional via slug)
-- A rota /api/booking/[slug] usa service_role, então não precisa de
-- política anon especial. Apenas o endpoint público faz lookup.
-- ============================================================

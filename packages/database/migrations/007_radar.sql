-- Migration 007: Sócio Radar
-- Adiciona configurações de radar por usuário

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS radar_enabled       boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS radar_alert_minutes int     NOT NULL DEFAULT 30;

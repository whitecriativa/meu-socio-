-- Migration 013: garante que todas as colunas extras do users existam
-- Seguro de rodar múltiplas vezes (IF NOT EXISTS)

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS work_modality       text,
  ADD COLUMN IF NOT EXISTS work_hours_start    text DEFAULT '08:00',
  ADD COLUMN IF NOT EXISTS work_hours_end      text DEFAULT '19:00',
  ADD COLUMN IF NOT EXISTS radar_alert_minutes integer DEFAULT 30,
  ADD COLUMN IF NOT EXISTS bom_dia_enabled     boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS avatar_url          text,
  ADD COLUMN IF NOT EXISTS google_calendar_token text,
  ADD COLUMN IF NOT EXISTS plan                text DEFAULT 'essencial';

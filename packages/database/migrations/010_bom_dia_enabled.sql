-- Migration 010: controle de opt-out do Bom Dia Sócio
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS bom_dia_enabled BOOLEAN NOT NULL DEFAULT true;

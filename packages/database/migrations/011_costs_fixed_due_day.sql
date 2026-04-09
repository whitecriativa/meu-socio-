-- Migration 011: adiciona dia de vencimento nos custos fixos
ALTER TABLE public.costs_fixed
  ADD COLUMN IF NOT EXISTS due_day INTEGER CHECK (due_day BETWEEN 1 AND 31);

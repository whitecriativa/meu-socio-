-- ============================================================
-- MIGRATIONS CONSOLIDADAS — Rodar no Supabase SQL Editor
-- Acesse: Supabase Dashboard → SQL Editor → New Query
-- Cole todo este arquivo e clique em "Run"
-- Seguro para rodar mesmo que algumas tabelas já existam.
-- ============================================================

-- ============================================================
-- MIGRATION 001 — Gamificação
-- ============================================================

-- Novos campos no users (ignorados se já existirem)
ALTER TABLE users ADD COLUMN IF NOT EXISTS work_modality TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS weekly_clients_avg INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- Tabela de gamificação
CREATE TABLE IF NOT EXISTS user_gamification (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                     UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  total_points                INTEGER NOT NULL DEFAULT 0,
  current_level               TEXT NOT NULL DEFAULT 'semente',
  current_streak              INTEGER NOT NULL DEFAULT 0,
  longest_streak              INTEGER NOT NULL DEFAULT 0,
  streak_protectors_available INTEGER NOT NULL DEFAULT 1,
  last_activity_date          DATE,
  missions_completed          INT NOT NULL DEFAULT 0,
  goals_completed             INT NOT NULL DEFAULT 0,
  referrals                   INT NOT NULL DEFAULT 0,
  last_weekly_report          TIMESTAMPTZ,
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_gamification ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "gamification_owner_all" ON user_gamification
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_user_gamification_user_id ON user_gamification(user_id);

-- Cria gamification automaticamente para novos usuários
CREATE OR REPLACE FUNCTION create_user_gamification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_gamification (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_create_user_gamification ON users;
CREATE TRIGGER trg_create_user_gamification
  AFTER INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION create_user_gamification();

-- Cria gamification para usuários que já existem (sem linha ainda)
INSERT INTO user_gamification (user_id)
SELECT id FROM users
WHERE id NOT IN (SELECT user_id FROM user_gamification)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================
-- MIGRATION 002 — Custos Fixos
-- ============================================================

CREATE TABLE IF NOT EXISTS public.costs_fixed (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID         NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name         TEXT         NOT NULL,
  amount       NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  periodicity  TEXT         NOT NULL DEFAULT 'mensal'
                            CHECK (periodicity IN ('mensal', 'semanal', 'anual')),
  category     TEXT         NOT NULL DEFAULT 'outro'
                            CHECK (category IN (
                              'aluguel', 'luz', 'agua', 'internet', 'telefone',
                              'software', 'funcionario', 'contador', 'outro'
                            )),
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

ALTER TABLE public.costs_fixed ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "costs_fixed_owner_all" ON public.costs_fixed
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS costs_fixed_user_id_idx ON public.costs_fixed(user_id);

-- ============================================================
-- MIGRATION 003 — Contratos parcelados
-- ============================================================

CREATE TABLE IF NOT EXISTS public.contracts (
  id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID         NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  client_name        TEXT         NOT NULL,
  description        TEXT         NOT NULL,
  total_amount       NUMERIC(10,2) NOT NULL CHECK (total_amount > 0),
  installments_count INT          NOT NULL CHECK (installments_count > 0),
  start_date         DATE         NOT NULL DEFAULT CURRENT_DATE,
  status             TEXT         NOT NULL DEFAULT 'ativo'
                                  CHECK (status IN ('ativo', 'concluido', 'cancelado')),
  created_at         TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.installments (
  id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id        UUID         NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  user_id            UUID         NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  installment_number INT          NOT NULL,
  amount             NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  due_date           DATE         NOT NULL,
  status             TEXT         NOT NULL DEFAULT 'pendente'
                                  CHECK (status IN ('pendente', 'pago', 'atrasado')),
  paid_at            TIMESTAMPTZ,
  created_at         TIMESTAMPTZ  NOT NULL DEFAULT now()
);

ALTER TABLE public.contracts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "contracts_owner_all" ON public.contracts
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "installments_owner_all" ON public.installments
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS contracts_user_id_idx     ON public.contracts(user_id);
CREATE INDEX IF NOT EXISTS installments_contract_idx ON public.installments(contract_id);
CREATE INDEX IF NOT EXISTS installments_user_id_idx  ON public.installments(user_id);

-- ============================================================
-- MIGRATION 004 — Alertas Inteligentes
-- ============================================================

CREATE TABLE IF NOT EXISTS public.smart_alerts (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type          TEXT        NOT NULL,
  title         TEXT        NOT NULL,
  message       TEXT        NOT NULL,
  action_url    TEXT,
  action_label  TEXT,
  triggered_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at       TIMESTAMPTZ,
  sent_whatsapp BOOLEAN     NOT NULL DEFAULT false
);

ALTER TABLE public.smart_alerts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "smart_alerts_owner_all" ON public.smart_alerts
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS smart_alerts_user_id_idx ON public.smart_alerts(user_id);

-- ============================================================
-- Campos de recorrência em appointments (se não existirem)
-- ============================================================

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS recurrence_type TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS recurrence_day  INT,
  ADD COLUMN IF NOT EXISTS recurrence_end_date DATE,
  ADD COLUMN IF NOT EXISTS is_recurrence_instance BOOLEAN NOT NULL DEFAULT false;

-- ============================================================
-- FIM DAS MIGRATIONS
-- ============================================================
-- Depois de rodar, todas as funcionalidades do painel estarão disponíveis.

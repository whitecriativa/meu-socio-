-- ============================================================
-- MIGRATION 004: Alertas Inteligentes, Recorrência, Sazonalidade
-- Referência: prompt-claude-code-meu-socio.md Tarefa 1
-- ============================================================

-- ============================================================
-- TABELA: smart_alerts
-- Alertas inteligentes gerados automaticamente pelo sistema.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.smart_alerts (
  id            uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid         NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type          text         NOT NULL CHECK (type IN (
                               'bills_due', 'budget_exceeded', 'revenue_drop',
                               'cost_spike', 'inactivity', 'goal_risk', 'streak_risk'
                             )),
  title         text         NOT NULL,
  message       text         NOT NULL,
  action_url    text,
  action_label  text,
  triggered_at  timestamptz  NOT NULL DEFAULT now(),
  read_at       timestamptz,
  sent_whatsapp boolean      NOT NULL DEFAULT false
);

ALTER TABLE public.smart_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_all" ON public.smart_alerts
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS smart_alerts_user_id_idx    ON public.smart_alerts(user_id);
CREATE INDEX IF NOT EXISTS smart_alerts_unread_idx     ON public.smart_alerts(user_id, read_at) WHERE read_at IS NULL;

-- ============================================================
-- TABELA: seasonal_calendar
-- Datas comerciais relevantes para alertas e sugestões.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.seasonal_calendar (
  id                    uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  title                 text  NOT NULL,
  date                  date  NOT NULL,
  segment               text,
  description           text,
  action_suggestion     text,
  reminder_days_before  int   NOT NULL DEFAULT 21
);

-- Seed com datas comerciais
INSERT INTO public.seasonal_calendar (title, date, segment, action_suggestion) VALUES
  ('Dia das Mães',       '2025-05-11', 'all',                    'Crie promoção especial com antecedência'),
  ('Dia dos Namorados',  '2025-06-12', 'beauty,fashion,food',    'Ofereça pacotes para casais'),
  ('Dia dos Pais',       '2025-08-10', 'all',                    'Prepare kits presentes ou experiências'),
  ('Black Friday',       '2025-11-28', 'all',                    'Prepare descontos com 3 semanas antes'),
  ('Natal',              '2025-12-25', 'all',                    'Inicie campanhas em novembro'),
  ('Carnaval',           '2026-02-16', 'beauty,food,events',     'Alta demanda — bloqueie agenda com antecedência'),
  ('Dia da Mulher',      '2026-03-08', 'beauty,health,fashion',  'Promoções e conteúdo especial'),
  ('Dia das Mães',       '2026-05-10', 'all',                    'Crie promoção especial com antecedência'),
  ('Dia dos Namorados',  '2026-06-12', 'beauty,fashion,food',    'Ofereça pacotes para casais')
ON CONFLICT DO NOTHING;

-- ============================================================
-- ALTER: appointments — campos de recorrência
-- ============================================================
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS recurrence_type     text CHECK (recurrence_type IN ('none','daily','weekly','biweekly','monthly')) DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS recurrence_day      int,
  ADD COLUMN IF NOT EXISTS recurrence_end_date date,
  ADD COLUMN IF NOT EXISTS parent_appointment_id uuid REFERENCES public.appointments(id),
  ADD COLUMN IF NOT EXISTS is_recurrence_instance boolean NOT NULL DEFAULT false;

-- ============================================================
-- ALTER: user_gamification — novos campos
-- ============================================================
ALTER TABLE public.user_gamification
  ADD COLUMN IF NOT EXISTS missions_completed    int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS goals_completed       int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referrals             int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_weekly_report    timestamptz;

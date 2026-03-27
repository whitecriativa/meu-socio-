-- ============================================================
-- MIGRATION 001: Onboarding de Perfil + Gamificação
-- Referência: PLAN.md seções 9 e 10
-- ============================================================

-- ============================================================
-- PARTE 1: Expandir tabela users (Seção 9 — Onboarding)
-- ============================================================

-- Novos campos de onboarding (RN-19)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS work_modality           TEXT CHECK (work_modality IN ('domicilio', 'estudio', 'salao', 'remoto', 'outro')),
  ADD COLUMN IF NOT EXISTS weekly_clients_avg      INTEGER,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- Expandir profile_type para cobrir todas as categorias (Seção 9.3)
-- Mantém valores antigos para não quebrar dados existentes
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_profile_type_check;
ALTER TABLE users ADD CONSTRAINT users_profile_type_check CHECK (profile_type IN (
  -- Categorias novas (Seção 9.3)
  'beleza_manicure', 'beleza_estetica', 'beleza_cabelo', 'beleza_maquiagem',
  'saude_psicologo', 'saude_nutricionista', 'saude_personal', 'saude_fisioterapeuta', 'saude_outro',
  'tecnico_eletricista', 'tecnico_encanador', 'tecnico_ti', 'tecnico_mecanico', 'tecnico_outro',
  'criativo_designer', 'criativo_fotografo', 'criativo_videomaker', 'criativo_copywriter', 'criativo_dev',
  'educacao_professor', 'educacao_tutor', 'educacao_coach',
  'juridico_advogado', 'contabil_contador',
  'outro',
  -- Valores legados (backward compat)
  'prestadora_servicos', 'freelancer_digital'
));

-- ============================================================
-- PARTE 2: Gamificação (Seção 10)
-- ============================================================

-- ------------------------------------------------------------
-- TABELA: user_gamification
-- Estado atual de pontos, nível e streak de cada usuário.
-- Uma linha por usuário (1-1).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_gamification (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                     UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  total_points                INTEGER NOT NULL DEFAULT 0 CHECK (total_points >= 0),
  current_level               TEXT NOT NULL DEFAULT 'semente' CHECK (current_level IN (
                                'semente', 'broto', 'arvore', 'estrela', 'cristal', 'socio_ouro'
                              )),
  current_streak              INTEGER NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak              INTEGER NOT NULL DEFAULT 0 CHECK (longest_streak >= 0),
  streak_protectors_available INTEGER NOT NULL DEFAULT 1 CHECK (streak_protectors_available >= 0), -- RN-22: 1 por mês
  last_activity_date          DATE,
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- TABELA: points_history
-- Log imutável de cada evento de pontuação.
-- Fonte da verdade para auditoria (RN-20: pontos não expiram).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS points_history (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN (
                 'atendimento_registrado',
                 'despesa_registrada',
                 'agendamento_criado',
                 'agendamento_confirmado',
                 'checkin_diario',
                 'cliente_reativado',
                 'meta_semanal',
                 'meta_mensal',
                 'dre_enviado',
                 'bom_dia_respondido',
                 'streak_7dias',
                 'streak_30dias'
               )),
  points      INTEGER NOT NULL CHECK (points > 0),
  description TEXT,
  reference_date DATE NOT NULL DEFAULT CURRENT_DATE, -- para aplicar RN-23 (1x por dia por ação)
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- TABELA: badges
-- Catálogo de todos os badges disponíveis (referência).
-- Gerenciado pelo sistema — não tem RLS (dados públicos/estáticos).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS badges (
  id          TEXT PRIMARY KEY,  -- ex: 'primeira_venda', 'agenda_cheia'
  name        TEXT NOT NULL,
  emoji       TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Seed dos badges (Seção 10.5)
INSERT INTO badges (id, name, emoji, description) VALUES
  ('primeira_venda',     'Primeira Venda',   '🎯', 'Registrou a primeira receita'),
  ('agenda_cheia',       'Agenda Cheia',     '📅', '10 agendamentos em uma semana'),
  ('em_chamas',          'Em Chamas',        '🔥', '7 dias seguidos de registro'),
  ('consistente',        'Consistente',      '💪', '30 dias seguidos de registro'),
  ('meta_batida',        'Meta Batida',      '🏆', 'Bateu a meta mensal pela 1ª vez'),
  ('tricampeao',         'Tricampeã',        '🥇', 'Bateu a meta 3 meses seguidos'),
  ('reconquista',        'Reconquista',      '🤝', 'Reativou 10 clientes inativos'),
  ('empresaria',         'Empresária',       '📊', 'Enviou DRE ao contador 3x'),
  ('sonhadora',          'Sonhadora',        '✨', 'Definiu e atualizou o sonho'),
  ('decolagem',          'Decolagem',        '🚀', 'Completou onboarding + 1ª semana ativa')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- TABELA: user_badges
-- Badges conquistados por cada usuário (RN-25: permanente).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_badges (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id  TEXT NOT NULL REFERENCES badges(id),
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, badge_id)  -- badge não se repete (RN-25)
);

-- ------------------------------------------------------------
-- TABELA: missions_progress
-- Rastreia missões diárias, semanais e mensais por período.
-- Uma linha por usuário/missão/período.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS missions_progress (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mission_id   TEXT NOT NULL CHECK (mission_id IN (
                 -- Diárias
                 'daily_registrar_atendimento',
                 'daily_responder_bom_dia',
                 'daily_confirmar_agendamento',
                 -- Semanais
                 'weekly_streak_5dias',
                 'weekly_reativar_cliente',
                 'weekly_meta_80pct',
                 'weekly_registrar_despesas',
                 -- Mensais
                 'monthly_meta_mensal',
                 'monthly_enviar_dre',
                 'monthly_novo_cliente',
                 'monthly_streak_20dias'
               )),
  mission_type TEXT NOT NULL CHECK (mission_type IN ('daily', 'weekly', 'monthly')),
  completed    BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  period_start DATE NOT NULL,  -- início do período (dia / segunda / 1º do mês)
  period_end   DATE NOT NULL,  -- fim do período
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, mission_id, period_start)  -- uma por período
);

-- ============================================================
-- INDEXES
-- ============================================================

-- user_gamification
CREATE INDEX IF NOT EXISTS idx_user_gamification_user_id ON user_gamification(user_id);
CREATE INDEX IF NOT EXISTS idx_user_gamification_level   ON user_gamification(current_level);

-- points_history
CREATE INDEX IF NOT EXISTS idx_points_history_user_id        ON points_history(user_id);
CREATE INDEX IF NOT EXISTS idx_points_history_user_date      ON points_history(user_id, reference_date DESC);
CREATE INDEX IF NOT EXISTS idx_points_history_action_date    ON points_history(user_id, action_type, reference_date); -- RN-23: 1x/dia

-- user_badges
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id   ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id  ON user_badges(badge_id);

-- missions_progress
CREATE INDEX IF NOT EXISTS idx_missions_user_id      ON missions_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_missions_user_period  ON missions_progress(user_id, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_missions_pending      ON missions_progress(user_id, completed) WHERE completed = false;

-- ============================================================
-- ROW LEVEL SECURITY (RN-01)
-- ============================================================

ALTER TABLE user_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_history     ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges        ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions_progress  ENABLE ROW LEVEL SECURITY;
-- badges é catálogo público — sem RLS necessário

-- user_gamification
CREATE POLICY "gamification_select_own"
  ON user_gamification FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "gamification_update_own"
  ON user_gamification FOR UPDATE
  USING (auth.uid() = user_id);

-- insert via service_role pelo n8n após cada ação
CREATE POLICY "gamification_insert_own"
  ON user_gamification FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- points_history (imutável — sem UPDATE/DELETE)
CREATE POLICY "points_history_select_own"
  ON points_history FOR SELECT
  USING (auth.uid() = user_id);

-- insert via service_role pelo n8n
CREATE POLICY "points_history_insert_own"
  ON points_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- user_badges
CREATE POLICY "user_badges_select_own"
  ON user_badges FOR SELECT
  USING (auth.uid() = user_id);

-- insert via service_role pelo n8n ao conquistar badge
CREATE POLICY "user_badges_insert_own"
  ON user_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- missions_progress
CREATE POLICY "missions_select_own"
  ON missions_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "missions_insert_own"
  ON missions_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "missions_update_own"
  ON missions_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- updated_at em user_gamification
CREATE TRIGGER trg_user_gamification_updated_at
  BEFORE UPDATE ON user_gamification
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Função: atualiza nível automaticamente ao acumular pontos (RN-21: nunca regride)
CREATE OR REPLACE FUNCTION sync_gamification_level()
RETURNS TRIGGER AS $$
DECLARE
  v_level TEXT;
BEGIN
  -- Calcula o nível baseado nos pontos acumulados (Seção 10.3)
  v_level := CASE
    WHEN NEW.total_points >= 8000 THEN 'socio_ouro'
    WHEN NEW.total_points >= 3500 THEN 'cristal'
    WHEN NEW.total_points >= 1500 THEN 'estrela'
    WHEN NEW.total_points >= 600  THEN 'arvore'
    WHEN NEW.total_points >= 200  THEN 'broto'
    ELSE 'semente'
  END;

  -- RN-21: nível nunca regride
  IF v_level > NEW.current_level OR NEW.current_level IS NULL THEN
    NEW.current_level := v_level;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_gamification_level
  BEFORE INSERT OR UPDATE OF total_points ON user_gamification
  FOR EACH ROW EXECUTE FUNCTION sync_gamification_level();

-- Função: cria registro de gamification automaticamente quando usuário é criado
CREATE OR REPLACE FUNCTION create_user_gamification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_gamification (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_create_user_gamification
  AFTER INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION create_user_gamification();

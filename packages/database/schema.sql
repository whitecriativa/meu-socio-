-- ============================================================
-- SOCIO - Schema do Banco de Dados (Supabase / PostgreSQL 15)
-- ============================================================
-- CRITICO: RLS ativo em todas as tabelas.
-- Toda query filtra por user_id. Nenhum dado cruzado entre usuarios.
-- ============================================================

-- Extensoes necessarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- busca fuzzy para clientes duplicados (RN-09)

-- ============================================================
-- TABELA: users
-- Donos do negocio. Vinculado ao Supabase Auth (auth.users).
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name                  TEXT NOT NULL,
  phone                 TEXT UNIQUE NOT NULL,       -- numero WhatsApp (identificador principal, RN-02)
  profile_type          TEXT NOT NULL CHECK (profile_type IN (
                          'beleza_manicure', 'beleza_estetica', 'beleza_cabelo', 'beleza_maquiagem',
                          'saude_psicologo', 'saude_nutricionista', 'saude_personal', 'saude_fisioterapeuta', 'saude_outro',
                          'tecnico_eletricista', 'tecnico_encanador', 'tecnico_ti', 'tecnico_mecanico', 'tecnico_outro',
                          'criativo_designer', 'criativo_fotografo', 'criativo_videomaker', 'criativo_copywriter', 'criativo_dev',
                          'educacao_professor', 'educacao_tutor', 'educacao_coach',
                          'juridico_advogado', 'contabil_contador',
                          'outro',
                          'prestadora_servicos', 'freelancer_digital'  -- legado
                        )),
  work_modality         TEXT CHECK (work_modality IN ('domicilio', 'estudio', 'salao', 'remoto', 'outro')), -- RN-19
  weekly_clients_avg    INTEGER,                     -- media de clientes por semana (RN-19)
  onboarding_completed_at TIMESTAMPTZ,               -- RN-16: onboarding so acontece uma vez
  dream                 TEXT,                        -- sonho registrado na entrada (F40, RN-18)
  monthly_goal          DECIMAL(12,2),               -- meta mensal de faturamento (F41)
  plan                  TEXT NOT NULL DEFAULT 'essencial' CHECK (plan IN ('essencial', 'profissional', 'acelerador')),
  work_hours_start      TIME DEFAULT '08:00',        -- horario de trabalho para o Radar (RN-11)
  work_hours_end        TIME DEFAULT '19:00',
  radar_alert_minutes   INTEGER DEFAULT 30,          -- alerta de sem resposta apos X min (F71)
  auto_suggest_reply    BOOLEAN DEFAULT false,       -- sugestao de resposta pela IA (F73)
  timezone              TEXT DEFAULT 'America/Sao_Paulo',
  stripe_customer_id    TEXT,
  stripe_subscription_id TEXT,
  active                BOOLEAN DEFAULT true,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: clients
-- Carteira de clientes do autonomo (F80-F84).
-- ============================================================
CREATE TABLE IF NOT EXISTS clients (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  phone         TEXT,
  email         TEXT,
  last_contact  TIMESTAMPTZ,
  total_spent   DECIMAL(12,2) DEFAULT 0,
  status        TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'vip')),
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: transactions
-- Lancamentos financeiros (F10-F21).
-- Sempre registra competence_date (DRE) E paid_at (fluxo de caixa) - RN-05.
-- Pro-labore vai em category='prolabore', entity='pf' - RN-06.
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id        UUID REFERENCES clients(id) ON DELETE SET NULL,
  type             TEXT NOT NULL CHECK (type IN ('receita', 'despesa')),
  amount           DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  category         TEXT NOT NULL,                   -- ver categorias no SPEC.md secao 3.1
  subcategory      TEXT,
  payment_method   TEXT CHECK (payment_method IN ('dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'transferencia', 'boleto', 'outro')),
  description      TEXT,
  competence_date  DATE NOT NULL,                   -- data de competencia (para DRE)
  paid_at          TIMESTAMPTZ,                     -- data de pagamento (para fluxo de caixa)
  is_paid          BOOLEAN DEFAULT false,
  entity           TEXT DEFAULT 'pj' CHECK (entity IN ('pj', 'pf')), -- separacao PJ/PF (F13)
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: appointments
-- Agendamentos (F30-F36).
-- ============================================================
CREATE TABLE IF NOT EXISTS appointments (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id                UUID REFERENCES clients(id) ON DELETE SET NULL,
  service                  TEXT NOT NULL,
  scheduled_at             TIMESTAMPTZ NOT NULL,    -- nunca no passado (RN-08)
  duration_minutes         INTEGER DEFAULT 60,
  status                   TEXT DEFAULT 'confirmado' CHECK (status IN ('confirmado', 'aguardando_confirmacao', 'cancelado', 'concluido', 'no_show')),
  price                    DECIMAL(12,2),
  notes                    TEXT,
  google_calendar_event_id TEXT,                   -- id do evento no Google Calendar (F31)
  cancellation_reason      TEXT,
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: tasks
-- Tarefas com Matriz de Eisenhower (F60-F64).
-- ============================================================
CREATE TABLE IF NOT EXISTS tasks (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  quadrant     TEXT CHECK (quadrant IN ('urgent_important', 'important_not_urgent', 'urgent_not_important', 'neither')),
  due_date     DATE,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: messages
-- Log de todas as mensagens WhatsApp (F01-F06).
-- Armazena transcricao de audios (F02) e intencao identificada (F03).
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phone               TEXT NOT NULL,               -- numero remetente/destinatario
  content             TEXT,                        -- texto da mensagem
  audio_url           TEXT,                        -- URL do audio no Supabase Storage
  transcription       TEXT,                        -- transcricao do Whisper (F02)
  direction           TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  intent              TEXT CHECK (intent IN ('financial', 'appointment', 'task', 'query', 'motivation', 'unknown')),
  intent_confidence   DECIMAL(3,2) CHECK (intent_confidence >= 0 AND intent_confidence <= 1), -- RN-03: < 0.70 pede clareza
  processed           BOOLEAN DEFAULT false,
  error               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: daily_metrics
-- Cache de metricas diarias para performance do painel (F90).
-- Atualizado pelo n8n apos cada lancamento.
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_metrics (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date                DATE NOT NULL,
  revenue             DECIMAL(12,2) DEFAULT 0,
  expenses            DECIMAL(12,2) DEFAULT 0,
  appointments_count  INTEGER DEFAULT 0,
  new_clients         INTEGER DEFAULT 0,
  calculated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ============================================================
-- TABELA: goals
-- Metas mensais de faturamento (F41-F44).
-- Uma meta por usuario por mes.
-- ============================================================
CREATE TABLE IF NOT EXISTS goals (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month            DATE NOT NULL,                  -- primeiro dia do mes (ex: 2025-03-01)
  target_revenue   DECIMAL(12,2) NOT NULL,
  achieved_revenue DECIMAL(12,2) DEFAULT 0,
  dream_note       TEXT,                           -- lembrete do sonho atrelado a meta
  status           TEXT DEFAULT 'active' CHECK (status IN ('active', 'achieved', 'failed')),
  achieved_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, month)
);

-- ============================================================
-- TABELA: ai_logs
-- Log de todas as chamadas de IA com custo estimado (F103, RN-14).
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_logs (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  model                TEXT NOT NULL,              -- 'gpt-4o-mini', 'gpt-4o', 'whisper-1'
  operation            TEXT NOT NULL,              -- 'intent_classification', 'advisory', 'transcription', 'daily_briefing'
  prompt_tokens        INTEGER NOT NULL DEFAULT 0,
  completion_tokens    INTEGER NOT NULL DEFAULT 0,
  total_tokens         INTEGER NOT NULL DEFAULT 0,
  estimated_cost_usd   DECIMAL(10,6) DEFAULT 0,
  message_id           UUID REFERENCES messages(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: motivational_history
-- Historico de mensagens motivacionais enviadas (RN-10).
-- Evita repeticao nos ultimos 30 dias.
-- ============================================================
CREATE TABLE IF NOT EXISTS motivational_history (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_hash TEXT NOT NULL,                      -- hash do texto para comparacao
  sent_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: message_queue
-- Fila de mensagens para retry quando OpenAI cai (RN-15).
-- ============================================================
CREATE TABLE IF NOT EXISTS message_queue (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_id   UUID REFERENCES messages(id) ON DELETE CASCADE,
  status       TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'done', 'failed')),
  attempts     INTEGER DEFAULT 0,
  last_attempt TIMESTAMPTZ,
  error        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- clients
CREATE INDEX IF NOT EXISTS idx_clients_user_id       ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_user_status   ON clients(user_id, status);
CREATE INDEX IF NOT EXISTS idx_clients_name_trgm     ON clients USING gin(name gin_trgm_ops); -- busca fuzzy (RN-09)

-- transactions
CREATE INDEX IF NOT EXISTS idx_transactions_user_id          ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_competence  ON transactions(user_id, competence_date);
CREATE INDEX IF NOT EXISTS idx_transactions_user_type        ON transactions(user_id, type);
CREATE INDEX IF NOT EXISTS idx_transactions_client           ON transactions(client_id);

-- appointments
CREATE INDEX IF NOT EXISTS idx_appointments_user_id         ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_user_scheduled  ON appointments(user_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_client          ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status          ON appointments(user_id, status);

-- tasks
CREATE INDEX IF NOT EXISTS idx_tasks_user_id    ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_quadrant   ON tasks(user_id, quadrant);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date   ON tasks(user_id, due_date);

-- messages
CREATE INDEX IF NOT EXISTS idx_messages_user_id    ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_processed  ON messages(user_id, processed) WHERE processed = false;

-- daily_metrics
CREATE INDEX IF NOT EXISTS idx_daily_metrics_user_date ON daily_metrics(user_id, date DESC);

-- ai_logs
CREATE INDEX IF NOT EXISTS idx_ai_logs_user_id    ON ai_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_created_at ON ai_logs(user_id, created_at DESC);

-- message_queue
CREATE INDEX IF NOT EXISTS idx_message_queue_status ON message_queue(status) WHERE status IN ('pending', 'processing');

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- CRITICO: Ativo em 100% das tabelas. (RN-01)
-- ============================================================

ALTER TABLE users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients             ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks               ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages            ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_metrics       ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals               ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_logs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE motivational_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_queue       ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- POLICIES: users
-- ------------------------------------------------------------
CREATE POLICY "users_select_own"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Apenas o service_role pode inserir (criado pelo webhook do Supabase Auth)
CREATE POLICY "users_insert_service_role"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ------------------------------------------------------------
-- POLICIES: clients
-- ------------------------------------------------------------
CREATE POLICY "clients_select_own"
  ON clients FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "clients_insert_own"
  ON clients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "clients_update_own"
  ON clients FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "clients_delete_own"
  ON clients FOR DELETE
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------
-- POLICIES: transactions
-- ------------------------------------------------------------
CREATE POLICY "transactions_select_own"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "transactions_insert_own"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "transactions_update_own"
  ON transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "transactions_delete_own"
  ON transactions FOR DELETE
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------
-- POLICIES: appointments
-- ------------------------------------------------------------
CREATE POLICY "appointments_select_own"
  ON appointments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "appointments_insert_own"
  ON appointments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "appointments_update_own"
  ON appointments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "appointments_delete_own"
  ON appointments FOR DELETE
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------
-- POLICIES: tasks
-- ------------------------------------------------------------
CREATE POLICY "tasks_select_own"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "tasks_insert_own"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tasks_update_own"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "tasks_delete_own"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------
-- POLICIES: messages
-- ------------------------------------------------------------
CREATE POLICY "messages_select_own"
  ON messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "messages_insert_own"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- mensagens nao sao editadas ou deletadas pelo usuario - apenas service_role via n8n

-- ------------------------------------------------------------
-- POLICIES: daily_metrics
-- ------------------------------------------------------------
CREATE POLICY "daily_metrics_select_own"
  ON daily_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "daily_metrics_insert_own"
  ON daily_metrics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "daily_metrics_update_own"
  ON daily_metrics FOR UPDATE
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------
-- POLICIES: goals
-- ------------------------------------------------------------
CREATE POLICY "goals_select_own"
  ON goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "goals_insert_own"
  ON goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "goals_update_own"
  ON goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "goals_delete_own"
  ON goals FOR DELETE
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------
-- POLICIES: ai_logs
-- ------------------------------------------------------------
CREATE POLICY "ai_logs_select_own"
  ON ai_logs FOR SELECT
  USING (auth.uid() = user_id);

-- insercao via service_role pelo n8n - usuario so le

-- ------------------------------------------------------------
-- POLICIES: motivational_history
-- ------------------------------------------------------------
CREATE POLICY "motivational_history_select_own"
  ON motivational_history FOR SELECT
  USING (auth.uid() = user_id);

-- insercao via service_role pelo n8n

-- ------------------------------------------------------------
-- POLICIES: message_queue
-- ------------------------------------------------------------
CREATE POLICY "message_queue_select_own"
  ON message_queue FOR SELECT
  USING (auth.uid() = user_id);

-- gerenciado via service_role pelo n8n

-- ============================================================
-- FUNCAO: atualizar updated_at automaticamente
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TABELA: user_gamification
-- Estado de pontos, nivel e streak por usuario (Secao 10).
-- Uma linha por usuario — criada automaticamente via trigger.
-- ============================================================
CREATE TABLE IF NOT EXISTS user_gamification (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                     UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  total_points                INTEGER NOT NULL DEFAULT 0 CHECK (total_points >= 0),
  current_level               TEXT NOT NULL DEFAULT 'semente' CHECK (current_level IN (
                                'semente', 'broto', 'arvore', 'estrela', 'cristal', 'socio_ouro'
                              )),
  current_streak              INTEGER NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak              INTEGER NOT NULL DEFAULT 0 CHECK (longest_streak >= 0),
  streak_protectors_available INTEGER NOT NULL DEFAULT 1 CHECK (streak_protectors_available >= 0),
  last_activity_date          DATE,
  updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: points_history
-- Log imutavel de cada evento de pontuacao (RN-20).
-- ============================================================
CREATE TABLE IF NOT EXISTS points_history (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type    TEXT NOT NULL CHECK (action_type IN (
                   'atendimento_registrado', 'despesa_registrada', 'agendamento_criado',
                   'agendamento_confirmado', 'checkin_diario', 'cliente_reativado',
                   'meta_semanal', 'meta_mensal', 'dre_enviado',
                   'bom_dia_respondido', 'streak_7dias', 'streak_30dias'
                 )),
  points         INTEGER NOT NULL CHECK (points > 0),
  description    TEXT,
  reference_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABELA: badges
-- Catalogo publico de todos os badges disponiveis (Secao 10.5).
-- ============================================================
CREATE TABLE IF NOT EXISTS badges (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  emoji       TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO badges (id, name, emoji, description) VALUES
  ('primeira_venda',  'Primeira Venda', '🎯', 'Registrou a primeira receita'),
  ('agenda_cheia',    'Agenda Cheia',   '📅', '10 agendamentos em uma semana'),
  ('em_chamas',       'Em Chamas',      '🔥', '7 dias seguidos de registro'),
  ('consistente',     'Consistente',    '💪', '30 dias seguidos de registro'),
  ('meta_batida',     'Meta Batida',    '🏆', 'Bateu a meta mensal pela 1ª vez'),
  ('tricampeao',      'Tricampeã',      '🥇', 'Bateu a meta 3 meses seguidos'),
  ('reconquista',     'Reconquista',    '🤝', 'Reativou 10 clientes inativos'),
  ('empresaria',      'Empresária',     '📊', 'Enviou DRE ao contador 3x'),
  ('sonhadora',       'Sonhadora',      '✨', 'Definiu e atualizou o sonho'),
  ('decolagem',       'Decolagem',      '🚀', 'Completou onboarding + 1ª semana ativa')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- TABELA: user_badges
-- Badges conquistados por usuario (RN-25: permanente).
-- ============================================================
CREATE TABLE IF NOT EXISTS user_badges (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id  TEXT NOT NULL REFERENCES badges(id),
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, badge_id)
);

-- ============================================================
-- TABELA: missions_progress
-- Progresso das missoes diarias, semanais e mensais (Secao 10.4).
-- ============================================================
CREATE TABLE IF NOT EXISTS missions_progress (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mission_id   TEXT NOT NULL CHECK (mission_id IN (
                 'daily_registrar_atendimento', 'daily_responder_bom_dia', 'daily_confirmar_agendamento',
                 'weekly_streak_5dias', 'weekly_reativar_cliente', 'weekly_meta_80pct', 'weekly_registrar_despesas',
                 'monthly_meta_mensal', 'monthly_enviar_dre', 'monthly_novo_cliente', 'monthly_streak_20dias'
               )),
  mission_type TEXT NOT NULL CHECK (mission_type IN ('daily', 'weekly', 'monthly')),
  completed    BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  period_start DATE NOT NULL,
  period_end   DATE NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, mission_id, period_start)
);

-- ============================================================
-- INDEXES — Gamificacao
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_user_gamification_user_id ON user_gamification(user_id);
CREATE INDEX IF NOT EXISTS idx_points_history_user_date  ON points_history(user_id, reference_date DESC);
CREATE INDEX IF NOT EXISTS idx_points_history_action     ON points_history(user_id, action_type, reference_date);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id       ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_missions_user_period      ON missions_progress(user_id, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_missions_pending          ON missions_progress(user_id, completed) WHERE completed = false;

-- ============================================================
-- RLS — Gamificacao (RN-01)
-- ============================================================
ALTER TABLE user_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_history     ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges        ENABLE ROW LEVEL SECURITY;
ALTER TABLE missions_progress  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gamification_select_own" ON user_gamification FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "gamification_insert_own" ON user_gamification FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "gamification_update_own" ON user_gamification FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "points_history_select_own" ON points_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "points_history_insert_own" ON points_history FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_badges_select_own" ON user_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_badges_insert_own" ON user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "missions_select_own" ON missions_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "missions_insert_own" ON missions_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "missions_update_own" ON missions_progress FOR UPDATE USING (auth.uid() = user_id);

-- Triggers de updated_at
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- FUNCAO: atualizar total_spent do cliente apos transacao
-- ============================================================
CREATE OR REPLACE FUNCTION update_client_total_spent()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.type = 'receita' AND NEW.client_id IS NOT NULL THEN
    UPDATE clients
    SET total_spent = total_spent + NEW.amount,
        last_contact = GREATEST(last_contact, NEW.competence_date::TIMESTAMPTZ)
    WHERE id = NEW.client_id;

  ELSIF TG_OP = 'DELETE' AND OLD.type = 'receita' AND OLD.client_id IS NOT NULL THEN
    UPDATE clients
    SET total_spent = GREATEST(0, total_spent - OLD.amount)
    WHERE id = OLD.client_id;

  ELSIF TG_OP = 'UPDATE' AND NEW.type = 'receita' AND NEW.client_id IS NOT NULL THEN
    UPDATE clients
    SET total_spent = GREATEST(0, total_spent - OLD.amount + NEW.amount)
    WHERE id = NEW.client_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_transactions_update_client
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_client_total_spent();

-- ============================================================
-- FUNCAO: marcar meta como atingida automaticamente (F44)
-- ============================================================
CREATE OR REPLACE FUNCTION check_goal_achievement()
RETURNS TRIGGER AS $$
DECLARE
  v_month DATE;
  v_total DECIMAL(12,2);
  v_goal  RECORD;
BEGIN
  -- calcula o primeiro dia do mes da transacao
  v_month := DATE_TRUNC('month', NEW.competence_date);

  -- soma receitas do mes para o usuario
  SELECT COALESCE(SUM(amount), 0) INTO v_total
  FROM transactions
  WHERE user_id = NEW.user_id
    AND type = 'receita'
    AND DATE_TRUNC('month', competence_date) = v_month;

  -- atualiza a meta do mes se existir
  UPDATE goals
  SET achieved_revenue = v_total,
      status = CASE WHEN v_total >= target_revenue AND status = 'active' THEN 'achieved' ELSE status END,
      achieved_at = CASE WHEN v_total >= target_revenue AND achieved_at IS NULL THEN NOW() ELSE achieved_at END
  WHERE user_id = NEW.user_id
    AND month = v_month;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_transactions_check_goal
  AFTER INSERT OR UPDATE ON transactions
  FOR EACH ROW
  WHEN (NEW.type = 'receita')
  EXECUTE FUNCTION check_goal_achievement();

-- ============================================================
-- FUNCAO: updated_at em user_gamification
-- ============================================================
CREATE TRIGGER trg_user_gamification_updated_at
  BEFORE UPDATE ON user_gamification
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- FUNCAO: calcular nivel por pontos (RN-21: nunca regride)
-- ============================================================
CREATE OR REPLACE FUNCTION sync_gamification_level()
RETURNS TRIGGER AS $$
DECLARE
  v_level TEXT;
BEGIN
  v_level := CASE
    WHEN NEW.total_points >= 8000 THEN 'socio_ouro'
    WHEN NEW.total_points >= 3500 THEN 'cristal'
    WHEN NEW.total_points >= 1500 THEN 'estrela'
    WHEN NEW.total_points >= 600  THEN 'arvore'
    WHEN NEW.total_points >= 200  THEN 'broto'
    ELSE 'semente'
  END;

  -- RN-21: nivel nunca regride
  IF v_level > NEW.current_level OR NEW.current_level IS NULL THEN
    NEW.current_level := v_level;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_gamification_level
  BEFORE INSERT OR UPDATE OF total_points ON user_gamification
  FOR EACH ROW EXECUTE FUNCTION sync_gamification_level();

-- ============================================================
-- FUNCAO: criar user_gamification ao criar usuario
-- ============================================================
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

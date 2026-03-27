// Tipos TypeScript espelhando exatamente o schema.sql
// Gerado manualmente — para regenerar automaticamente: supabase gen types typescript

// ── Enums ────────────────────────────────────────────────────────────────────

export type ProfileType =
  // Beleza e estética (Seção 9.3)
  | 'beleza_manicure' | 'beleza_estetica' | 'beleza_cabelo' | 'beleza_maquiagem'
  // Saúde e bem-estar
  | 'saude_psicologo' | 'saude_nutricionista' | 'saude_personal' | 'saude_fisioterapeuta' | 'saude_outro'
  // Serviços técnicos
  | 'tecnico_eletricista' | 'tecnico_encanador' | 'tecnico_ti' | 'tecnico_mecanico' | 'tecnico_outro'
  // Criativo e digital
  | 'criativo_designer' | 'criativo_fotografo' | 'criativo_videomaker' | 'criativo_copywriter' | 'criativo_dev'
  // Educação
  | 'educacao_professor' | 'educacao_tutor' | 'educacao_coach'
  // Jurídico e contábil
  | 'juridico_advogado' | 'contabil_contador'
  // Outros
  | 'outro'
  // Legado (backward compat)
  | 'prestadora_servicos' | 'freelancer_digital'

export type WorkModality = 'domicilio' | 'estudio' | 'salao' | 'remoto' | 'outro'
export type Plan = 'essencial' | 'profissional' | 'acelerador'
export type ClientStatus = 'active' | 'inactive' | 'vip'
export type TransactionType = 'receita' | 'despesa'
export type PaymentMethod =
  | 'dinheiro'
  | 'pix'
  | 'cartao_credito'
  | 'cartao_debito'
  | 'transferencia'
  | 'boleto'
  | 'outro'
export type Entity = 'pj' | 'pf'
export type AppointmentStatus =
  | 'confirmado'
  | 'aguardando_confirmacao'
  | 'cancelado'
  | 'concluido'
  | 'no_show'
export type TaskQuadrant =
  | 'urgent_important'
  | 'important_not_urgent'
  | 'urgent_not_important'
  | 'neither'
export type MessageDirection = 'inbound' | 'outbound'
export type MessageIntent =
  | 'financial'
  | 'appointment'
  | 'task'
  | 'query'
  | 'motivation'
  | 'unknown'
export type GoalStatus = 'active' | 'achieved' | 'failed'
export type QueueStatus = 'pending' | 'processing' | 'done' | 'failed'
export type AiOperation =
  | 'intent_classification'
  | 'advisory'
  | 'transcription'
  | 'daily_briefing'

// ── Tabelas ───────────────────────────────────────────────────────────────────

export type GamificationLevel = 'semente' | 'broto' | 'arvore' | 'estrela' | 'cristal' | 'socio_ouro'

export type PointsActionType =
  | 'atendimento_registrado'
  | 'despesa_registrada'
  | 'agendamento_criado'
  | 'agendamento_confirmado'
  | 'checkin_diario'
  | 'cliente_reativado'
  | 'meta_semanal'
  | 'meta_mensal'
  | 'dre_enviado'
  | 'bom_dia_respondido'
  | 'streak_7dias'
  | 'streak_30dias'

export type MissionId =
  | 'daily_registrar_atendimento' | 'daily_responder_bom_dia' | 'daily_confirmar_agendamento'
  | 'weekly_streak_5dias' | 'weekly_reativar_cliente' | 'weekly_meta_80pct' | 'weekly_registrar_despesas'
  | 'monthly_meta_mensal' | 'monthly_enviar_dre' | 'monthly_novo_cliente' | 'monthly_streak_20dias'

export type MissionType = 'daily' | 'weekly' | 'monthly'

export type BadgeId =
  | 'primeira_venda' | 'agenda_cheia' | 'em_chamas' | 'consistente'
  | 'meta_batida' | 'tricampeao' | 'reconquista' | 'empresaria'
  | 'sonhadora' | 'decolagem'

export interface User {
  id: string
  name: string
  phone: string
  profile_type: ProfileType
  work_modality: WorkModality | null        // modalidade de trabalho (RN-19)
  weekly_clients_avg: number | null         // media de clientes/semana (RN-19)
  onboarding_completed_at: string | null    // RN-16: só acontece uma vez
  dream: string | null
  monthly_goal: number | null
  plan: Plan
  work_hours_start: string       // "HH:MM"
  work_hours_end: string         // "HH:MM"
  radar_alert_minutes: number
  auto_suggest_reply: boolean
  timezone: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  user_id: string
  name: string
  phone: string | null
  email: string | null
  last_contact: string | null
  total_spent: number
  status: ClientStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  user_id: string
  client_id: string | null
  type: TransactionType
  amount: number
  category: string
  subcategory: string | null
  payment_method: PaymentMethod | null
  description: string | null
  competence_date: string        // "YYYY-MM-DD" — usado no DRE (RN-05)
  paid_at: string | null         // TIMESTAMPTZ — usado no fluxo de caixa (RN-05)
  is_paid: boolean
  entity: Entity                 // separação PJ/PF (F13, RN-06)
  created_at: string
  updated_at: string
}

export interface Appointment {
  id: string
  user_id: string
  client_id: string | null
  service: string
  scheduled_at: string           // nunca no passado (RN-08)
  duration_minutes: number
  status: AppointmentStatus
  price: number | null
  notes: string | null
  google_calendar_event_id: string | null
  cancellation_reason: string | null
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  user_id: string
  title: string
  description: string | null
  quadrant: TaskQuadrant | null
  due_date: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  user_id: string
  phone: string
  content: string | null
  audio_url: string | null
  transcription: string | null
  direction: MessageDirection
  intent: MessageIntent | null
  intent_confidence: number | null  // 0–1; < 0.70 aciona pedido de clareza (RN-03)
  processed: boolean
  error: string | null
  created_at: string
}

export interface DailyMetric {
  id: string
  user_id: string
  date: string
  revenue: number
  expenses: number
  appointments_count: number
  new_clients: number
  calculated_at: string
}

export interface Goal {
  id: string
  user_id: string
  month: string                  // "YYYY-MM-01"
  target_revenue: number
  achieved_revenue: number
  dream_note: string | null
  status: GoalStatus
  achieved_at: string | null
  created_at: string
  updated_at: string
}

export interface AiLog {
  id: string
  user_id: string
  model: string
  operation: AiOperation
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
  estimated_cost_usd: number
  message_id: string | null
  created_at: string
}

export interface MotivationalHistory {
  id: string
  user_id: string
  message_hash: string
  sent_at: string
}

export interface MessageQueue {
  id: string
  user_id: string
  message_id: string | null
  status: QueueStatus
  attempts: number
  last_attempt: string | null
  error: string | null
  created_at: string
}

// ── Insert / Update helpers ───────────────────────────────────────────────────

export interface UserGamification {
  id: string
  user_id: string
  total_points: number
  current_level: GamificationLevel
  current_streak: number
  longest_streak: number
  streak_protectors_available: number
  last_activity_date: string | null  // "YYYY-MM-DD"
  updated_at: string
}

export interface PointsHistory {
  id: string
  user_id: string
  action_type: PointsActionType
  points: number
  description: string | null
  reference_date: string             // "YYYY-MM-DD" — para RN-23 (1x/dia)
  created_at: string
}

export interface Badge {
  id: BadgeId
  name: string
  emoji: string
  description: string
  created_at: string
}

export interface UserBadge {
  id: string
  user_id: string
  badge_id: BadgeId
  earned_at: string
}

export interface MissionProgress {
  id: string
  user_id: string
  mission_id: MissionId
  mission_type: MissionType
  completed: boolean
  completed_at: string | null
  period_start: string               // "YYYY-MM-DD"
  period_end: string                 // "YYYY-MM-DD"
  created_at: string
}

// ── Insert / Update helpers ───────────────────────────────────────────────────

export type UserInsert = Omit<User, 'created_at' | 'updated_at'>
export type ClientInsert = Omit<Client, 'id' | 'created_at' | 'updated_at'>
export type TransactionInsert = Omit<Transaction, 'id' | 'created_at' | 'updated_at'>
export type AppointmentInsert = Omit<Appointment, 'id' | 'created_at' | 'updated_at'>
export type TaskInsert = Omit<Task, 'id' | 'created_at' | 'updated_at'>
export type GoalInsert = Omit<Goal, 'id' | 'created_at' | 'updated_at'>
export type AiLogInsert = Omit<AiLog, 'id' | 'created_at'>
export type MessageInsert = Omit<Message, 'id' | 'created_at'>

export type ClientUpdate = Partial<Omit<Client, 'id' | 'user_id' | 'created_at'>>
export type TransactionUpdate = Partial<Omit<Transaction, 'id' | 'user_id' | 'created_at'>>
export type AppointmentUpdate = Partial<Omit<Appointment, 'id' | 'user_id' | 'created_at'>>
export type TaskUpdate = Partial<Omit<Task, 'id' | 'user_id' | 'created_at'>>
export type GoalUpdate = Partial<Omit<Goal, 'id' | 'user_id' | 'created_at'>>

// Gamificação
export type GamificationUpdate = Partial<Omit<UserGamification, 'id' | 'user_id' | 'updated_at'>>
export type PointsHistoryInsert = Omit<PointsHistory, 'id' | 'created_at'>
export type UserBadgeInsert = Omit<UserBadge, 'id' | 'earned_at'>
export type MissionProgressInsert = Omit<MissionProgress, 'id' | 'created_at'>
export type MissionProgressUpdate = Partial<Pick<MissionProgress, 'completed' | 'completed_at'>>

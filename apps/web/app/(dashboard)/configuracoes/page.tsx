import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { CustosFixosSection } from '@/components/configuracoes/custos-fixos-section'
import type { CustoFixo } from '@/components/configuracoes/custos-fixos-section'

export const dynamic = 'force-dynamic'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

function toInputTime(value: string | null | undefined): string {
  if (!value) return '08:00'
  return value.slice(0, 5)
}

async function updateSettings(formData: FormData) {
  'use server'

  const userId  = process.env.NEXT_PUBLIC_DEMO_USER_ID!
  const supabase = adminClient()

  const name           = String(formData.get('name') ?? '').trim()
  const profileType    = String(formData.get('profile_type') ?? '').trim()
  const workModality   = String(formData.get('work_modality') ?? '')
  const dream          = String(formData.get('dream') ?? '').trim()
  const monthlyGoal    = parseFloat(String(formData.get('monthly_goal') ?? '0').replace(',', '.'))
  const workStart      = String(formData.get('work_hours_start') ?? '08:00')
  const workEnd        = String(formData.get('work_hours_end') ?? '19:00')
  const radarMinutes   = parseInt(String(formData.get('radar_alert_minutes') ?? '30'))

  await supabase
    .from('users')
    .update({
      name:                name || undefined,
      profile_type:        profileType || null,
      work_modality:       workModality || null,
      dream:               dream || null,
      monthly_goal:        monthlyGoal > 0 ? monthlyGoal : null,
      work_hours_start:    workStart,
      work_hours_end:      workEnd,
      radar_alert_minutes: radarMinutes > 0 ? radarMinutes : 30,
    })
    .eq('id', userId)

  revalidatePath('/')
  revalidatePath('/configuracoes')
  revalidatePath('/metas')
  redirect('/configuracoes?saved=1')
}

export default async function ConfiguracoesPage({
  searchParams,
}: {
  searchParams?: Promise<{ saved?: string }>
}) {
  const params   = await (searchParams ?? Promise.resolve({} as { saved?: string }))
  const userId   = process.env.NEXT_PUBLIC_DEMO_USER_ID!
  const supabase = adminClient()

  const [{ data: user }, { data: rawCosts }] = await Promise.all([
    supabase
      .from('users')
      .select('name, phone, profile_type, work_modality, dream, monthly_goal, work_hours_start, work_hours_end, radar_alert_minutes, plan')
      .eq('id', userId)
      .single(),
    supabase
      .from('costs_fixed')
      .select('id, name, amount, periodicity, category')
      .eq('user_id', userId)
      .order('created_at', { ascending: true }),
  ])

  const custos: CustoFixo[] = (rawCosts ?? []).map((c) => ({
    id:          String(c.id),
    name:        String(c.name),
    amount:      Number(c.amount),
    periodicity: (c.periodicity as CustoFixo['periodicity']) ?? 'mensal',
    category:    String(c.category ?? 'outro'),
  }))

  const saved = params.saved === '1'

  return (
    <div className="px-4 py-5 md:px-8 md:py-8 max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Configurações</h1>
        <p className="text-sm text-gray-500 mt-0.5">Perfil, metas e preferências do Meu Sócio</p>
      </div>

      {saved && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 font-medium">
          ✅ Configurações salvas com sucesso.
        </div>
      )}

      {/* ── Formulário de configurações do perfil ─────────── */}
      <form action={updateSettings} className="space-y-5">

        {/* Perfil */}
        <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-800">Perfil</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">Nome</label>
              <input
                name="name"
                type="text"
                defaultValue={user?.name ?? ''}
                placeholder="Seu nome"
                required
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#5B3FD4] focus:ring-2 focus:ring-[#5B3FD4]/10 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">Telefone / WhatsApp</label>
              <input
                value={user?.phone ?? ''}
                readOnly
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-400 cursor-not-allowed"
              />
              <p className="text-[10px] text-gray-400">Vinculado ao WhatsApp — não editável</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">Profissão / área de atuação</label>
              <input
                name="profile_type"
                type="text"
                list="profissao-sugestoes"
                defaultValue={user?.profile_type ?? ''}
                placeholder="Ex: Designer, Psicóloga, Eletricista..."
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#5B3FD4] focus:ring-2 focus:ring-[#5B3FD4]/10 transition"
              />
              <datalist id="profissao-sugestoes">
                <option value="Autônomo(a)" />
                <option value="Freelancer" />
                <option value="Consultor(a)" />
                <option value="Prestador(a) de serviços" />
                <option value="Profissional liberal" />
                <option value="Designer" />
                <option value="Desenvolvedor(a)" />
                <option value="Fotógrafo(a)" />
                <option value="Advogado(a)" />
                <option value="Psicólogo(a)" />
                <option value="Nutricionista" />
                <option value="Personal trainer" />
                <option value="Esteticista" />
                <option value="Contador(a)" />
                <option value="Arquiteto(a)" />
              </datalist>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">Modalidade de trabalho</label>
              <select
                name="work_modality"
                defaultValue={user?.work_modality ?? 'presencial'}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#5B3FD4] focus:ring-2 focus:ring-[#5B3FD4]/10 transition bg-white"
              >
                <option value="presencial">Presencial</option>
                <option value="remoto">Remoto / Online</option>
                <option value="hibrido">Híbrido</option>
                <option value="domicilio">A domicílio / na casa do cliente</option>
                <option value="outro">Outro</option>
              </select>
            </div>
          </div>
        </section>

        {/* Metas */}
        <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-800">Metas e sonho</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">Meta mensal de faturamento (R$)</label>
              <input
                type="number"
                name="monthly_goal"
                min="0"
                step="0.01"
                defaultValue={user?.monthly_goal ?? ''}
                placeholder="Ex: 5000"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#5B3FD4] focus:ring-2 focus:ring-[#5B3FD4]/10 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">
                Seu sonho <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <input
                name="dream"
                type="text"
                defaultValue={user?.dream ?? ''}
                placeholder="Ex: Viagem para a Europa, trocar de carro..."
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#5B3FD4] focus:ring-2 focus:ring-[#5B3FD4]/10 transition"
              />
            </div>
          </div>
        </section>

        {/* Expediente e Radar */}
        <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-800">Expediente e alertas</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">Início do expediente</label>
              <input
                type="time"
                name="work_hours_start"
                defaultValue={toInputTime(user?.work_hours_start)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#5B3FD4] focus:ring-2 focus:ring-[#5B3FD4]/10 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">Fim do expediente</label>
              <input
                type="time"
                name="work_hours_end"
                defaultValue={toInputTime(user?.work_hours_end)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#5B3FD4] focus:ring-2 focus:ring-[#5B3FD4]/10 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">Alerta Radar (minutos)</label>
              <input
                type="number"
                name="radar_alert_minutes"
                min="5"
                max="120"
                defaultValue={user?.radar_alert_minutes ?? 30}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#5B3FD4] focus:ring-2 focus:ring-[#5B3FD4]/10 transition"
              />
              <p className="text-[10px] text-gray-400">Aviso de mensagem sem resposta</p>
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#5B3FD4' }}
          >
            Salvar configurações
          </button>
        </div>
      </form>

      {/* ── Custos Fixos — tem suas próprias Server Actions ── */}
      <CustosFixosSection initialCosts={custos} />

      {/* ── Plano e integrações (somente leitura) ─────────── */}
      <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 space-y-3">
        <h2 className="text-sm font-semibold text-gray-800">Plano e integrações</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
            <p className="text-xs text-gray-400 mb-0.5">Plano atual</p>
            <p className="text-sm font-semibold text-gray-900 capitalize">
              {user?.plan ?? 'Essencial'}
            </p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
            <p className="text-xs text-gray-400 mb-0.5">WhatsApp (Evolution API)</p>
            <p className="text-sm font-semibold text-amber-600">Aguardando chip dedicado</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
            <p className="text-xs text-gray-400 mb-0.5">Google Calendar</p>
            <p className="text-sm font-semibold text-gray-400">Não conectado</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
            <p className="text-xs text-gray-400 mb-0.5">Bom Dia Sócio (n8n cron 7h)</p>
            <p className="text-sm font-semibold text-[#1a9e5c]">Ativo no Railway</p>
          </div>
        </div>
      </section>
    </div>
  )
}

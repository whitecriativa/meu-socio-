import { getAuthenticatedUserId } from '@/lib/get-user-id'
import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { AvatarUpload } from '@/components/configuracoes/avatar-upload'

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

  const userId = (await getAuthenticatedUserId()) ?? process.env.NEXT_PUBLIC_DEMO_USER_ID!
  const supabase = adminClient()

  const name           = String(formData.get('name') ?? '').trim()
  const phone          = String(formData.get('phone') ?? '').trim().replace(/\D/g, '')
  const profileType    = String(formData.get('profile_type') ?? '').trim()
  const workModality   = String(formData.get('work_modality') ?? '')
  const monthlyGoal    = parseFloat(String(formData.get('monthly_goal') ?? '0').replace(',', '.'))
  const workStart      = String(formData.get('work_hours_start') ?? '08:00')
  const workEnd        = String(formData.get('work_hours_end') ?? '19:00')
  const radarMinutes   = parseInt(String(formData.get('radar_alert_minutes') ?? '30'))
  const bomDiaEnabled  = formData.get('bom_dia_enabled') === '1'

  // Campos base — existem desde a migration inicial
  const coreData: Record<string, unknown> = {
    name:         name || null,
    profile_type: profileType || null,
    monthly_goal: monthlyGoal > 0 ? monthlyGoal : null,
  }
  if (phone && phone.length >= 10) coreData.phone = phone

  // Campos estendidos — podem não existir se migrações não foram rodadas
  const fullData: Record<string, unknown> = {
    ...coreData,
    work_modality:       workModality || null,
    work_hours_start:    workStart,
    work_hours_end:      workEnd,
    radar_alert_minutes: radarMinutes > 0 ? radarMinutes : 30,
    bom_dia_enabled:     bomDiaEnabled,
  }

  // Tenta update completo; se falhar (coluna ausente = 42703), faz update só dos campos base
  const { error: fullError } = await supabase.from('users').update(fullData).eq('id', userId)
  if (fullError) {
    await supabase.from('users').update(coreData).eq('id', userId)
  }

  revalidatePath('/')
  revalidatePath('/configuracoes')
  revalidatePath('/metas')
  redirect('/configuracoes?saved=1')
}

export default async function ConfiguracoesPage({
  searchParams,
}: {
  searchParams?: Promise<{ saved?: string; gcal?: string }>
}) {
  const params   = await (searchParams ?? Promise.resolve({} as { saved?: string; gcal?: string }))
  const userId = (await getAuthenticatedUserId()) ?? process.env.NEXT_PUBLIC_DEMO_USER_ID!
  const supabase = adminClient()

  const { data: user } = await supabase
    .from('users')
    .select('name, phone, profile_type, work_modality, dream, monthly_goal, work_hours_start, work_hours_end, radar_alert_minutes, plan, avatar_url, google_calendar_token, bom_dia_enabled')
    .eq('id', userId)
    .single()

  const saved    = params.saved === '1'
  const gcalOk   = params.gcal === '1'
  const gcalErr  = params.gcal === 'error'

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
      {gcalOk && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 font-medium">
          ✅ Google Calendar conectado! Seus agendamentos serão sincronizados automaticamente.
        </div>
      )}
      {gcalErr && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 font-medium">
          Erro ao conectar Google Calendar. Tente novamente.
        </div>
      )}

      <form action={updateSettings} className="space-y-5">

        {/* Perfil */}
        <section className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-800">Perfil</h2>

          <AvatarUpload
            userId={userId}
            currentUrl={user?.avatar_url ?? null}
            name={user?.name ?? 'Usuário'}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">Nome</label>
              <input
                name="name"
                type="text"
                defaultValue={user?.name ?? ''}
                placeholder="Seu nome"
                required
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#0F40CB] focus:ring-2 focus:ring-[#0F40CB]/10 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">Seu número WhatsApp</label>
              <input
                name="phone"
                type="tel"
                defaultValue={user?.phone?.startsWith('uid_') ? '' : (user?.phone ?? '')}
                placeholder="Ex: 11999998888 (só números)"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#0F40CB] focus:ring-2 focus:ring-[#0F40CB]/10 transition"
              />
              <p className="text-[10px] text-gray-400">DDD + número, sem espaços ou traços</p>
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
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#0F40CB] focus:ring-2 focus:ring-[#0F40CB]/10 transition"
              />
              <datalist id="profissao-sugestoes">
                {/* Geral */}
                <option value="Autônomo(a)" />
                <option value="Freelancer" />
                <option value="Consultor(a)" />
                <option value="Prestador(a) de serviços" />
                <option value="Profissional liberal" />
                {/* Beleza & Estética */}
                <option value="Manicure / Pedicure" />
                <option value="Cabeleireiro(a)" />
                <option value="Barbeiro(a)" />
                <option value="Esteticista" />
                <option value="Maquiadora(or)" />
                <option value="Lashista / Designer de sobrancelhas" />
                <option value="Massoterapeuta" />
                <option value="Depiladora(or)" />
                {/* Saúde */}
                <option value="Psicólogo(a)" />
                <option value="Nutricionista" />
                <option value="Personal trainer" />
                <option value="Fisioterapeuta" />
                <option value="Terapeuta" />
                <option value="Dentista" />
                <option value="Enfermeiro(a)" />
                <option value="Médico(a)" />
                <option value="Fonoaudiólogo(a)" />
                {/* Digital & Criativo */}
                <option value="Designer" />
                <option value="Designer gráfico(a)" />
                <option value="Desenvolvedor(a)" />
                <option value="Programador(a)" />
                <option value="Social media" />
                <option value="Copywriter" />
                <option value="Videomaker" />
                <option value="Fotógrafo(a)" />
                <option value="Editor(a) de vídeo" />
                <option value="Gestor(a) de tráfego" />
                <option value="Criador(a) de conteúdo" />
                {/* Serviços & Manutenção */}
                <option value="Eletricista" />
                <option value="Encanador(a)" />
                <option value="Pintor(a)" />
                <option value="Marceneiro(a)" />
                <option value="Diarista / Faxineira" />
                <option value="Jardineiro(a)" />
                <option value="Técnico(a) em informática" />
                <option value="Mecânico(a)" />
                <option value="Pedreiro(a)" />
                {/* Educação */}
                <option value="Professor(a) particular" />
                <option value="Coach" />
                <option value="Instrutor(a)" />
                {/* Negócios & Jurídico */}
                <option value="Advogado(a)" />
                <option value="Contador(a)" />
                <option value="Arquiteto(a)" />
                <option value="Engenheiro(a)" />
                <option value="Corretor(a) de imóveis" />
                <option value="Corretor(a) de seguros" />
                <option value="Assistente virtual" />
              </datalist>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">Modalidade de trabalho</label>
              <select
                name="work_modality"
                defaultValue={user?.work_modality ?? 'presencial'}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#0F40CB] focus:ring-2 focus:ring-[#0F40CB]/10 transition bg-white"
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
          <h2 className="text-sm font-semibold text-gray-800">Meta mensal</h2>

          <div className="space-y-1.5 max-w-xs">
            <label className="text-xs font-medium text-gray-600">Meta de faturamento (R$)</label>
            <input
              type="number"
              name="monthly_goal"
              min="0"
              step="0.01"
              defaultValue={user?.monthly_goal ?? ''}
              placeholder="Ex: 5000"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#0F40CB] focus:ring-2 focus:ring-[#0F40CB]/10 transition"
            />
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
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#0F40CB] focus:ring-2 focus:ring-[#0F40CB]/10 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">Fim do expediente</label>
              <input
                type="time"
                name="work_hours_end"
                defaultValue={toInputTime(user?.work_hours_end)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#0F40CB] focus:ring-2 focus:ring-[#0F40CB]/10 transition"
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
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#0F40CB] focus:ring-2 focus:ring-[#0F40CB]/10 transition"
              />
              <p className="text-[10px] text-gray-400">Aviso de mensagem sem resposta</p>
            </div>
          </div>

          {/* Toggle Bom Dia */}
          <div className="flex items-center justify-between py-2 border-t border-gray-50">
            <div>
              <p className="text-sm font-medium text-gray-700">☀️ Bom Dia Sócio (7h)</p>
              <p className="text-xs text-gray-400">Briefing diário com faturamento, agenda e metas</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="hidden"
                name="bom_dia_enabled"
                value="0"
              />
              <input
                type="checkbox"
                name="bom_dia_enabled"
                value="1"
                defaultChecked={user?.bom_dia_enabled !== false}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-gray-200 peer-checked:bg-[#0F40CB] rounded-full transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:bg-white after:rounded-full after:shadow after:transition-all peer-checked:after:translate-x-5" />
            </label>
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#0F40CB' }}
          >
            Salvar configurações
          </button>
        </div>
      </form>

      {/* ── Como falar com o Sócio ─────────── */}
      <section className="rounded-2xl bg-[#0F40CB] p-5 space-y-3">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <svg viewBox="0 0 32 32" className="w-4 h-4 flex-shrink-0" fill="currentColor" aria-hidden="true"><path d="M16 2C8.28 2 2 8.28 2 16c0 2.44.65 4.74 1.79 6.73L2 30l7.45-1.76A13.93 13.93 0 0 0 16 30c7.72 0 14-6.28 14-14S23.72 2 16 2zm0 25.5a11.44 11.44 0 0 1-5.82-1.59l-.42-.25-4.42 1.04 1.07-4.3-.28-.44A11.47 11.47 0 0 1 4.5 16C4.5 9.6 9.6 4.5 16 4.5S27.5 9.6 27.5 16 22.4 27.5 16 27.5zm6.29-8.57c-.34-.17-2.03-1-2.35-1.11-.32-.12-.55-.17-.78.17-.23.34-.9 1.11-1.1 1.34-.2.23-.4.26-.75.09-.34-.17-1.45-.54-2.76-1.71-1.02-.91-1.7-2.04-1.9-2.38-.2-.34-.02-.52.15-.69.15-.15.34-.4.51-.6.17-.2.23-.34.34-.57.12-.23.06-.43-.03-.6-.09-.17-.78-1.88-1.07-2.58-.28-.68-.57-.59-.78-.6H10.9c-.2 0-.52.08-.79.37-.28.3-1.05 1.02-1.05 2.5s1.07 2.9 1.22 3.1c.17.2 2.1 3.21 5.09 4.5.71.31 1.27.5 1.7.64.72.23 1.37.2 1.89.12.58-.09 1.78-.73 2.03-1.43.25-.7.25-1.3.17-1.43-.08-.12-.3-.2-.64-.37z"/></svg>
          Como falar com o Sócio
        </h2>
        <p className="text-sm text-white/80">
          Adicione o número abaixo na sua agenda como <strong className="text-white">&quot;Meu Sócio&quot;</strong> e mande mensagem diretamente no WhatsApp.
        </p>
        <a
          href={`https://wa.me/${process.env.NEXT_PUBLIC_BOT_PHONE ?? ''}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 bg-white/10 hover:bg-white/20 transition-colors rounded-xl px-4 py-3"
        >
          <svg viewBox="0 0 32 32" className="w-6 h-6 flex-shrink-0 text-white" fill="currentColor" aria-hidden="true"><path d="M16 2C8.28 2 2 8.28 2 16c0 2.44.65 4.74 1.79 6.73L2 30l7.45-1.76A13.93 13.93 0 0 0 16 30c7.72 0 14-6.28 14-14S23.72 2 16 2zm0 25.5a11.44 11.44 0 0 1-5.82-1.59l-.42-.25-4.42 1.04 1.07-4.3-.28-.44A11.47 11.47 0 0 1 4.5 16C4.5 9.6 9.6 4.5 16 4.5S27.5 9.6 27.5 16 22.4 27.5 16 27.5zm6.29-8.57c-.34-.17-2.03-1-2.35-1.11-.32-.12-.55-.17-.78.17-.23.34-.9 1.11-1.1 1.34-.2.23-.4.26-.75.09-.34-.17-1.45-.54-2.76-1.71-1.02-.91-1.7-2.04-1.9-2.38-.2-.34-.02-.52.15-.69.15-.15.34-.4.51-.6.17-.2.23-.34.34-.57.12-.23.06-.43-.03-.6-.09-.17-.78-1.88-1.07-2.58-.28-.68-.57-.59-.78-.6H10.9c-.2 0-.52.08-.79.37-.28.3-1.05 1.02-1.05 2.5s1.07 2.9 1.22 3.1c.17.2 2.1 3.21 5.09 4.5.71.31 1.27.5 1.7.64.72.23 1.37.2 1.89.12.58-.09 1.78-.73 2.03-1.43.25-.7.25-1.3.17-1.43-.08-.12-.3-.2-.64-.37z"/></svg>
          <div>
            <p className="text-sm font-bold text-white">Abrir conversa com Meu Sócio</p>
            <p className="text-xs text-white/60">Clique para abrir no WhatsApp</p>
          </div>
        </a>
        <p className="text-xs text-white/60">
          Exemplos: &quot;registrar receita 150 pix&quot;, &quot;agendar João amanhã 10h&quot;, &quot;quanto faturei este mês?&quot;
        </p>
      </section>

      {/* ── Plano e Google Calendar ─────────── */}
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
            <p className="text-xs text-gray-400 mb-0.5">Google Calendar</p>
            {user?.google_calendar_token ? (
              <p className="text-sm font-semibold text-[#0F40CB]">✅ Conectado</p>
            ) : (
              <a
                href="/api/auth/google-calendar"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-[#0F40CB] hover:bg-[#0a32a0] transition-colors px-3 py-1.5 rounded-lg mt-1"
              >
                Conectar Google Calendar
              </a>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

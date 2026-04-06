/** Calcula a data da Páscoa pelo algoritmo anônimo gregoriano */
function getEaster(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1 // 0-indexed
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month, day)
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86400000)
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function toKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Nth weekday of a month. weekday: 0=Dom, 7=Sab. n: 1=primeiro, 2=segundo... */
function nthWeekday(year: number, month: number, weekday: number, n: number): Date {
  const d = new Date(year, month, 1)
  let count = 0
  while (d.getMonth() === month) {
    if (d.getDay() === weekday) {
      count++
      if (count === n) return new Date(d)
    }
    d.setDate(d.getDate() + 1)
  }
  return new Date(year, month, 1) // fallback
}

/**
 * Retorna mapa de 'YYYY-MM-DD' → nome da data sazonal/feriado
 * para o ano fornecido.
 */
export function getSeasonalDates(year: number): Record<string, string> {
  const dates: Record<string, string> = {}

  // ── Feriados nacionais fixos ────────────────────────────────────
  dates[`${year}-01-01`] = '🎆 Ano Novo'
  dates[`${year}-04-21`] = '⚖️ Tiradentes'
  dates[`${year}-05-01`] = '👷 Dia do Trabalho'
  dates[`${year}-09-07`] = '🇧🇷 Independência'
  dates[`${year}-10-12`] = '🙏 N. S. Aparecida'
  dates[`${year}-11-02`] = '🕯️ Finados'
  dates[`${year}-11-15`] = '🏛️ Proclamação da República'
  dates[`${year}-11-20`] = '✊ Consciência Negra'
  dates[`${year}-12-25`] = '🎄 Natal'
  dates[`${year}-12-31`] = '🥂 Véspera de Ano Novo'

  // ── Feriados móveis baseados na Páscoa ──────────────────────────
  const easter = getEaster(year)
  dates[toKey(addDays(easter, -48))] = '🎉 Carnaval'
  dates[toKey(addDays(easter, -47))] = '🎉 Carnaval'
  dates[toKey(addDays(easter, -2))]  = '✝️ Sexta-feira Santa'
  dates[toKey(easter)]               = '✝️ Páscoa'
  dates[toKey(addDays(easter, 60))]  = '✝️ Corpus Christi'

  // ── Datas comemorativas ─────────────────────────────────────────
  dates[`${year}-01-25`] = '🏙️ Aniversário SP'
  dates[`${year}-02-14`] = '💑 Valentine\'s Day'
  dates[`${year}-03-08`] = '🌸 Dia da Mulher'
  dates[`${year}-03-15`] = '🛒 Dia do Consumidor'
  dates[`${year}-04-01`] = '😄 Dia da Mentira'
  dates[`${year}-05-27`] = '💰 Black Friday BE' // placeholder; calculado abaixo
  dates[`${year}-06-12`] = '❤️ Dia dos Namorados'
  dates[`${year}-07-28`] = '👨‍💻 Dia do Autônomo'
  dates[`${year}-10-31`] = '🎃 Halloween'

  // Dia das Mães: 2º domingo de Maio
  dates[toKey(nthWeekday(year, 4, 0, 2))] = '💐 Dia das Mães'

  // Dia dos Pais: 2º domingo de Agosto
  dates[toKey(nthWeekday(year, 7, 0, 2))] = '👔 Dia dos Pais'

  // Dia das Crianças: 12 de Outubro (já coberto como N.S.Aparecida)
  // Adicionar indicação extra
  if (dates[`${year}-10-12`]) {
    dates[`${year}-10-12`] += ' / 🎈 Dia das Crianças'
  }

  // Black Friday: 4ª sexta-feira de Novembro
  const bf = nthWeekday(year, 10, 5, 4)
  dates[toKey(bf)] = '🛍️ Black Friday'
  delete dates[`${year}-05-27`] // remove placeholder

  return dates
}

/** Filtra datas sazonais para um mês específico (0-indexed) */
export function getSeasonalDatesForMonth(
  year: number,
  month: number,
): Record<string, string> {
  const all = getSeasonalDates(year)
  const prefix = `${year}-${pad(month + 1)}`
  return Object.fromEntries(
    Object.entries(all).filter(([k]) => k.startsWith(prefix)),
  )
}

import type { DreGroup, DreStructured } from '@/components/financeiro/types'

export type TxRow = {
  id: string
  type: string
  amount: number | null
  category: string | null
  description: string | null
  payment_method: string | null
  competence_date: string | null
  client_id: string | null
}

export function mapRevenueGroup(cat: string | null): string {
  const c = (cat ?? '').toLowerCase()
  if (['produto', 'venda', 'mercad', 'estoque'].some(k => c.includes(k))) return 'Venda de Produtos'
  if (['outros', 'other', 'diversas'].some(k => c.includes(k))) return 'Outros Ingressos'
  return 'Prestação de Serviços'
}

export type ExpenseGroup =
  | 'Custo dos Serviços'
  | 'Despesas Administrativas'
  | 'Despesas Comerciais'
  | 'Despesas com Pessoal'
  | 'Impostos e Taxas'
  | 'Despesas Financeiras'
  | 'Outras Despesas'

export function mapExpenseGroup(cat: string | null): ExpenseGroup {
  const c = (cat ?? '').toLowerCase()
  if (['material', 'insumo', 'produto', 'estoque', 'cmv', 'csv'].some(k => c.includes(k))) return 'Custo dos Serviços'
  if (['aluguel', 'energia', 'agua', 'internet', 'telefone', 'equip', 'manut', 'escritorio', 'condom', 'seguro', 'limpeza'].some(k => c.includes(k))) return 'Despesas Administrativas'
  if (['marketing', 'publicidade', 'propaganda', 'venda', 'comissao', 'influencer'].some(k => c.includes(k))) return 'Despesas Comerciais'
  if (['pessoal', 'salario', 'folha', 'labore', 'funcionario', 'colabor', 'terceiro', 'trabalhista'].some(k => c.includes(k))) return 'Despesas com Pessoal'
  if (['imposto', 'taxa', 'simples', 'iss', 'darf', 'irpf', 'irpj', 'inss', 'tributo', 'contribuicao'].some(k => c.includes(k))) return 'Impostos e Taxas'
  if (['financ', 'banco', 'juros', 'tarifa', 'iof', 'cartao', 'emprestimo', 'parcel'].some(k => c.includes(k))) return 'Despesas Financeiras'
  return 'Outras Despesas'
}

export function buildDreGroup(title: string, items: { label: string; value: number }[]): DreGroup {
  return { title, items, total: items.reduce((s, i) => s + i.value, 0) }
}

export function buildDreStructured(
  revenues: TxRow[],
  expenses: TxRow[],
  totalRevenue: number,
  totalExpenses: number,
  period: string,
): DreStructured {
  // Receitas agrupadas
  const revMap = new Map<string, number>()
  for (const t of revenues) {
    const g = mapRevenueGroup(t.category)
    revMap.set(g, (revMap.get(g) ?? 0) + Number(t.amount ?? 0))
  }
  const receitas: DreGroup[] = revMap.size > 0
    ? [buildDreGroup('Receita Operacional Bruta', [...revMap.entries()].map(([label, value]) => ({ label, value })))]
    : [buildDreGroup('Receita Operacional Bruta', [{ label: 'Sem receitas no período', value: 0 }])]

  // Despesas por grupo
  const expMap = new Map<ExpenseGroup, Map<string, number>>()
  for (const t of expenses) {
    const g = mapExpenseGroup(t.category)
    if (!expMap.has(g)) expMap.set(g, new Map())
    const label = t.description || t.category || 'Despesa'
    expMap.get(g)!.set(label, (expMap.get(g)!.get(label) ?? 0) + Number(t.amount ?? 0))
  }

  function getGroup(key: ExpenseGroup): DreGroup | null {
    const m = expMap.get(key)
    if (!m || m.size === 0) return null
    return buildDreGroup(key, [...m.entries()].map(([label, value]) => ({ label, value })))
  }

  const csp = getGroup('Custo dos Serviços')
  const lucroBruto = totalRevenue - (csp?.total ?? 0)

  const opGroups: ExpenseGroup[] = ['Despesas Administrativas', 'Despesas Comerciais', 'Despesas com Pessoal', 'Outras Despesas']
  const despesasOperacionais = opGroups.map(g => getGroup(g)).filter((g): g is DreGroup => g !== null)
  const totalDespesasOp = despesasOperacionais.reduce((s, g) => s + g.total, 0)
  const resultadoOperacional = lucroBruto - totalDespesasOp

  const impostosETaxas = getGroup('Impostos e Taxas')
  const despesasFinanceiras = getGroup('Despesas Financeiras')

  const resultado = totalRevenue - totalExpenses
  const margem = totalRevenue > 0 ? Math.round((resultado / totalRevenue) * 100) : 0

  return {
    period,
    receitas,
    totalReceitas: totalRevenue,
    csp,
    lucroBruto,
    despesasOperacionais,
    totalDespesasOp,
    resultadoOperacional,
    impostosETaxas,
    despesasFinanceiras,
    totalDespesas: totalExpenses,
    resultado,
    margem,
  }
}

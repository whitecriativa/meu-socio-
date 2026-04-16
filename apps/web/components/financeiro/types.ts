import type { IndicatorsData } from './indicators-grid'
import type { LancamentoItem } from './lancamentos-list'
import type { ContratoDado } from './contratos-list'

export interface DreItem {
  label: string
  value: number
  sub?: { label: string; value: number }[]
  isResult?: boolean
  isDeduction?: boolean
}

export interface DreLineItem {
  label: string
  value: number
}

export interface DreGroup {
  title: string
  items: DreLineItem[]
  total: number
}

/** DRE estruturado no padrão contábil para microempreendedores */
export interface DreStructured {
  period: string              // "Maio de 2026"
  // Receitas
  receitas: DreGroup[]
  totalReceitas: number
  // Custo dos Serviços Prestados
  csp: DreGroup | null
  lucroBruto: number
  // Despesas operacionais agrupadas
  despesasOperacionais: DreGroup[]
  totalDespesasOp: number
  resultadoOperacional: number
  // Impostos e financeiras
  impostosETaxas: DreGroup | null
  despesasFinanceiras: DreGroup | null
  // Resultado final
  totalDespesas: number
  resultado: number
  margem: number              // %
}

export interface FinanceiroData {
  month: string
  dre: DreItem[]
  dreStructured: DreStructured
  indicators: IndicatorsData
  revenueHistory: { month: string; revenue: number; expenses: number }[]
  expensesByCategory: { name: string; value: number; color: string }[]
  lancamentos: LancamentoItem[]
  contratos: ContratoDado[]
}

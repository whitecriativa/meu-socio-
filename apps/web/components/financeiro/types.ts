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

export interface FinanceiroData {
  month: string
  dre: DreItem[]
  indicators: IndicatorsData
  revenueHistory: { month: string; revenue: number; expenses: number }[]
  expensesByCategory: { name: string; value: number; color: string }[]
  lancamentos: LancamentoItem[]
  contratos: ContratoDado[]
}

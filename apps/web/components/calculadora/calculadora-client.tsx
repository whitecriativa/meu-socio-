'use client'

import { useState } from 'react'
import { Calculator, TrendingUp, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  profileType: string
  fixedCosts: number
  servicesThisMonth: number
  avgTicket: number
  hasCadasteredCosts?: boolean
}

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

function pct(v: number) {
  return `${Math.round(v)}%`
}

type MarginStatus = 'great' | 'ok' | 'danger'

function getMarginStatus(margin: number): MarginStatus {
  if (margin >= 40) return 'great'
  if (margin >= 20) return 'ok'
  return 'danger'
}

const MARGIN_STYLES: Record<MarginStatus, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  great:  { color: 'text-[#0F40CB]', bg: 'bg-[#B6F273]/10', icon: <CheckCircle className="w-4 h-4" />, label: 'Margem saudável' },
  ok:     { color: 'text-amber-600',  bg: 'bg-amber-50',      icon: <Info className="w-4 h-4" />,         label: 'Margem razoável' },
  danger: { color: 'text-red-500',    bg: 'bg-red-50',        icon: <AlertTriangle className="w-4 h-4" />, label: 'Margem baixa'    },
}

export function CalculadoraClient({ profileType, fixedCosts, servicesThisMonth, avgTicket, hasCadasteredCosts }: Props) {
  // Inputs do usuário
  const [preco, setPreco]           = useState(avgTicket > 0 ? String(avgTicket) : '')
  const [custoFixo, setCustoFixo]   = useState(fixedCosts > 0 ? String(Math.round(fixedCosts)) : '')
  const [servicos, setServicos]     = useState(servicesThisMonth > 0 ? String(servicesThisMonth) : '')
  const [insumos, setInsumos]       = useState('')
  const [prolabore, setProlabore]   = useState('')
  const [imposto, setImposto]       = useState('6')  // MEI simples ~6%

  const precoNum     = parseFloat(preco.replace(',', '.'))    || 0
  const fixoNum      = parseFloat(custoFixo.replace(',', '.')) || 0
  const servicosNum  = parseInt(servicos)                      || 1
  const insumosNum   = parseFloat(insumos.replace(',', '.'))  || 0
  const prolaboreNum = parseFloat(prolabore.replace(',', '.')) || 0
  const impostoNum   = parseFloat(imposto.replace(',', '.'))  || 0

  // Custo fixo por serviço
  const fixoPorServico = fixoNum / servicosNum

  // Imposto sobre o preço
  const impostoValor = precoNum * (impostoNum / 100)

  // Custo total por serviço
  const custoTotal = fixoPorServico + insumosNum + impostoValor

  // Margem com o preço atual
  const lucro  = precoNum - custoTotal
  const margem = precoNum > 0 ? (lucro / precoNum) * 100 : 0

  // Preço mínimo (apenas cobre custos, 0% de margem)
  const precoMinimo = custoTotal / (1 - impostoNum / 100)

  // Preço ideal (40% de margem)
  const precoIdeal = precoMinimo / (1 - 0.40)

  // Preço com pró-labore embutido
  const precoComProlabore = prolaboreNum > 0
    ? (custoTotal + prolaboreNum / servicosNum) / (1 - impostoNum / 100) / (1 - 0.40)
    : null

  const marginStatus = getMarginStatus(margem)
  const ms = MARGIN_STYLES[marginStatus]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Calculadora de Precificação</h1>
        <p className="text-sm text-gray-500 mt-0.5">Descubra se o seu preço está cobrindo todos os custos</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Inputs */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                <Calculator className="w-4 h-4 text-[#0F40CB]" />
                Dados do seu negócio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Preço que você cobra (R$)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={preco}
                  onChange={(e) => setPreco(e.target.value)}
                  placeholder="Ex: 150"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0F40CB] focus:ring-2 focus:ring-[#0F40CB]/10 transition"
                />
                <p className="text-[10px] text-gray-400 mt-0.5">Valor cobrado por serviço/produto/hora</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Custos fixos mensais (R$)
                  {fixedCosts > 0 && (
                    <span className="text-[#0F40CB] ml-1 font-normal">
                      {hasCadasteredCosts ? '(dos seus custos cadastrados)' : '(despesas do mês atual)'}
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  min="0"
                  value={custoFixo}
                  onChange={(e) => setCustoFixo(e.target.value)}
                  placeholder="Ex: 1200"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0F40CB] focus:ring-2 focus:ring-[#0F40CB]/10 transition"
                />
                <p className="text-[10px] text-gray-400 mt-0.5">Aluguel, internet, ferramentas, assinaturas...</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Serviços/vendas por mês
                  {servicesThisMonth > 0 && (
                    <span className="text-[#0F40CB] ml-1 font-normal">(do mês atual)</span>
                  )}
                </label>
                <input
                  type="number"
                  min="1"
                  value={servicos}
                  onChange={(e) => setServicos(e.target.value)}
                  placeholder="Ex: 40"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0F40CB] focus:ring-2 focus:ring-[#0F40CB]/10 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Custo variável por serviço (R$) <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={insumos}
                  onChange={(e) => setInsumos(e.target.value)}
                  placeholder="Ex: 20 (material, embalagem...)"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0F40CB] focus:ring-2 focus:ring-[#0F40CB]/10 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Pró-labore desejado/mês (R$) <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={prolabore}
                  onChange={(e) => setProlabore(e.target.value)}
                  placeholder="Ex: 3000"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0F40CB] focus:ring-2 focus:ring-[#0F40CB]/10 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Imposto (%) <span className="text-gray-400 font-normal">MEI Simples Nacional ~6%</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={imposto}
                  onChange={(e) => setImposto(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0F40CB] focus:ring-2 focus:ring-[#0F40CB]/10 transition"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resultados */}
        <div className="space-y-4">
          {/* Análise do preço atual */}
          {precoNum > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                  <TrendingUp className="w-4 h-4 text-[#0F40CB]" />
                  Análise do seu preço atual
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Status da margem */}
                <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl ${ms.bg}`}>
                  <span className={ms.color}>{ms.icon}</span>
                  <div>
                    <p className={`text-sm font-semibold ${ms.color}`}>{ms.label}</p>
                    <p className={`text-xs ${ms.color}`}>Margem de {pct(margem)} sobre o preço</p>
                  </div>
                </div>

                {/* Breakdown de custos */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Custo fixo por serviço</span>
                    <span className="font-medium text-gray-700">{fmt(fixoPorServico)}</span>
                  </div>
                  {insumosNum > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Custo variável</span>
                      <span className="font-medium text-gray-700">{fmt(insumosNum)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Imposto ({pct(impostoNum)})</span>
                    <span className="font-medium text-gray-700">{fmt(impostoValor)}</span>
                  </div>
                  <div className="flex justify-between text-xs border-t border-gray-100 pt-2">
                    <span className="text-gray-500">Total de custos</span>
                    <span className="font-semibold text-gray-800">{fmt(custoTotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 font-medium">Lucro por serviço</span>
                    <span className={`font-bold ${lucro >= 0 ? 'text-[#0F40CB]' : 'text-red-500'}`}>
                      {fmt(lucro)}
                    </span>
                  </div>
                </div>

                {/* Barra de margem */}
                <div>
                  <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                    <span>Custos</span>
                    <span>Lucro</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-3 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(0, Math.min(100, margem))}%`,
                        backgroundColor: margem >= 40 ? '#B6F273' : margem >= 20 ? '#fbbf24' : '#f87171',
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preços sugeridos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-gray-700">Preços de referência</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-red-50 rounded-xl p-3">
                <p className="text-xs text-red-400 font-medium mb-0.5">Preço mínimo (apenas cobre custos)</p>
                <p className="text-xl font-bold text-red-600">{fmt(precoMinimo > 0 ? precoMinimo : 0)}</p>
                <p className="text-[10px] text-red-400 mt-0.5">Abaixo disso você tem prejuízo</p>
              </div>

              <div className="bg-[#0F40CB]/5 rounded-xl p-3">
                <p className="text-xs text-[#0F40CB] font-medium mb-0.5">Preço ideal (40% de margem)</p>
                <p className="text-xl font-bold text-[#0F40CB]">{fmt(precoIdeal > 0 ? precoIdeal : 0)}</p>
                <p className="text-[10px] text-[#0F40CB]/60 mt-0.5">Margem saudável e sustentável</p>
              </div>

              {precoComProlabore && precoComProlabore > 0 && (
                <div className="bg-[#B6F273]/10 rounded-xl p-3">
                  <p className="text-xs text-[#0F40CB] font-medium mb-0.5">Com pró-labore de {fmt(prolaboreNum)}/mês</p>
                  <p className="text-xl font-bold text-[#0F40CB]">{fmt(precoComProlabore)}</p>
                  <p className="text-[10px] text-[#0F40CB]/60 mt-0.5">Cobre custos + seu salário + 40% margem</p>
                </div>
              )}

              {/* Comparação */}
              {precoNum > 0 && precoIdeal > 0 && (
                <div className={`rounded-xl px-3 py-2 text-xs ${
                  precoNum >= precoIdeal
                    ? 'bg-[#B6F273]/10 text-[#0F40CB]'
                    : precoNum >= precoMinimo
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-red-50 text-red-600'
                }`}>
                  {precoNum >= precoIdeal
                    ? `✅ Seu preço está ${fmt(precoNum - precoIdeal)} acima do ideal. Excelente!`
                    : precoNum >= precoMinimo
                    ? `⚠️ Seu preço cobre os custos, mas está ${fmt(precoIdeal - precoNum)} abaixo do ideal.`
                    : `🚨 Atenção: seu preço está ${fmt(precoMinimo - precoNum)} abaixo do mínimo!`
                  }
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dica educacional */}
          {fixoNum > 0 && servicosNum > 0 && (
            <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-500 space-y-1">
              <p className="font-semibold text-gray-700">Como interpretar:</p>
              <p>• Seus custos fixos de {fmt(fixoNum)} divididos por {servicosNum} serviços = {fmt(fixoPorServico)} por serviço</p>
              <p>• Se você atender mais clientes, o custo fixo por serviço cai automaticamente</p>
              <p>• Margem abaixo de 20% é sinal de alerta — revise seus preços ou reduza custos</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

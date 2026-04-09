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
function pct(v: number) { return `${Math.round(v)}%` }

type Mode = 'atendimento' | 'contrato'

export function CalculadoraClient({ fixedCosts, servicesThisMonth, avgTicket, hasCadasteredCosts }: Props) {
  const [mode, setMode] = useState<Mode>('atendimento')

  const [preco, setPreco]         = useState(avgTicket > 0 ? String(Math.round(avgTicket)) : '')
  const [servicos, setServicos]   = useState(servicesThisMonth > 0 ? String(servicesThisMonth) : '')
  const [insumos, setInsumos]     = useState('')
  const [contrato, setContrato]   = useState('')
  const [custoFixo, setCustoFixo] = useState(fixedCosts > 0 ? String(Math.round(fixedCosts)) : '')
  const [prolabore, setProlabore] = useState('')
  const [imposto, setImposto]     = useState('6')

  const fixoNum      = parseFloat(custoFixo.replace(',', '.'))  || 0
  const prolaboreNum = parseFloat(prolabore.replace(',', '.'))  || 0
  const impostoNum   = parseFloat(imposto.replace(',', '.'))    || 0

  // Modo atendimento
  const precoNum    = parseFloat(preco.replace(',', '.'))   || 0
  const servicosNum = parseInt(servicos)                     || 1
  const insumosNum  = parseFloat(insumos.replace(',', '.')) || 0
  const fixoPorSvc  = fixoNum / servicosNum
  const prolaboreSvc = prolaboreNum / servicosNum
  const impostoSvc  = precoNum * (impostoNum / 100)
  const custoSvc    = fixoPorSvc + insumosNum + impostoSvc + prolaboreSvc
  const lucroSvc    = precoNum - custoSvc
  const margemSvc   = precoNum > 0 ? (lucroSvc / precoNum) * 100 : 0
  const minSvc      = (fixoPorSvc + insumosNum + prolaboreSvc) / (1 - impostoNum / 100)
  const idealSvc    = minSvc / (1 - 0.40)

  // Modo contrato
  const contratoNum  = parseFloat(contrato.replace(',', '.')) || 0
  const impostoContr = contratoNum * (impostoNum / 100)
  const custoContr   = fixoNum + prolaboreNum + impostoContr
  const lucroContr   = contratoNum - custoContr
  const margemContr  = contratoNum > 0 ? (lucroContr / contratoNum) * 100 : 0
  const minContr     = (fixoNum + prolaboreNum) / (1 - impostoNum / 100)
  const idealContr   = minContr / (1 - 0.40)

  const margem = mode === 'atendimento' ? margemSvc : margemContr
  const lucro  = mode === 'atendimento' ? lucroSvc  : lucroContr
  const refMin  = mode === 'atendimento' ? minSvc    : minContr
  const refIdeal = mode === 'atendimento' ? idealSvc  : idealContr
  const refPreco = mode === 'atendimento' ? precoNum  : contratoNum

  const marginColor = margem >= 40 ? '#B6F273' : margem >= 20 ? '#fbbf24' : '#f87171'
  const ml = margem >= 40
    ? { icon: <CheckCircle className="w-4 h-4" />, text: 'Margem saudável', c: 'text-[#0F40CB]', bg: 'bg-[#B6F273]/10' }
    : margem >= 20
    ? { icon: <Info className="w-4 h-4" />, text: 'Margem razoável', c: 'text-amber-600', bg: 'bg-amber-50' }
    : { icon: <AlertTriangle className="w-4 h-4" />, text: 'Margem baixa', c: 'text-red-500', bg: 'bg-red-50' }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Calculadora de Precificação</h1>
        <p className="text-sm text-gray-500 mt-0.5">Descubra se o seu preço está cobrindo todos os custos</p>
      </div>

      {/* Toggle */}
      <div>
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
          {(['atendimento', 'contrato'] as Mode[]).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                mode === m ? 'bg-white text-[#0F40CB] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {m === 'atendimento' ? 'Por atendimento' : 'Valor fixo mensal'}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-1.5">
          {mode === 'atendimento'
            ? 'Para quem cobra por serviço, hora, consulta ou projeto individual'
            : 'Para quem cobra um valor fixo por mês — retainer, contrato, mensalidade'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
              <Calculator className="w-4 h-4 text-[#0F40CB]" /> Dados do seu negócio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mode === 'atendimento' ? (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Preço por atendimento (R$)</label>
                  <input type="number" min="0" step="0.01" value={preco} onChange={(e) => setPreco(e.target.value)}
                    placeholder="Ex: 150"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0F40CB] transition" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Atendimentos por mês
                    {servicesThisMonth > 0 && <span className="text-[#0F40CB] ml-1 font-normal">(do mês atual)</span>}
                  </label>
                  <input type="number" min="1" value={servicos} onChange={(e) => setServicos(e.target.value)}
                    placeholder="Ex: 40"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0F40CB] transition" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Custo variável por atendimento (R$) <span className="text-gray-400">(opcional)</span>
                  </label>
                  <input type="number" min="0" value={insumos} onChange={(e) => setInsumos(e.target.value)}
                    placeholder="Material, produto, embalagem..."
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0F40CB] transition" />
                </div>
              </>
            ) : (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Valor do contrato/mês (R$)</label>
                <input type="number" min="0" step="0.01" value={contrato} onChange={(e) => setContrato(e.target.value)}
                  placeholder="Ex: 2000"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0F40CB] transition" />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Custos fixos mensais (R$)
                {fixedCosts > 0 && (
                  <span className="text-[#0F40CB] ml-1 font-normal">
                    {hasCadasteredCosts ? '(dos seus custos cadastrados)' : '(despesas do mês)'}
                  </span>
                )}
              </label>
              <input type="number" min="0" value={custoFixo} onChange={(e) => setCustoFixo(e.target.value)}
                placeholder="Ex: 1200 — aluguel, internet, assinaturas..."
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0F40CB] transition" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Seu salário desejado/mês (R$) <span className="text-gray-400">(opcional)</span>
              </label>
              <input type="number" min="0" value={prolabore} onChange={(e) => setProlabore(e.target.value)}
                placeholder="Ex: 3000"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0F40CB] transition" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Imposto (%) <span className="text-gray-400">MEI ~6%</span>
              </label>
              <input type="number" min="0" max="100" step="0.5" value={imposto} onChange={(e) => setImposto(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#0F40CB] transition" />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {refPreco > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                  <TrendingUp className="w-4 h-4 text-[#0F40CB]" /> Análise do seu preço
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl ${ml.bg}`}>
                  <span className={ml.c}>{ml.icon}</span>
                  <div>
                    <p className={`text-sm font-semibold ${ml.c}`}>{ml.text}</p>
                    <p className={`text-xs ${ml.c}`}>Margem de {pct(margem)} sobre o valor</p>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  {mode === 'atendimento' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Custo fixo por atendimento</span>
                        <span className="font-medium">{fmt(fixoPorSvc)}</span>
                      </div>
                      {insumosNum > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Custo variável</span>
                          <span className="font-medium">{fmt(insumosNum)}</span>
                        </div>
                      )}
                      {prolaboreSvc > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Salário por atendimento</span>
                          <span className="font-medium">{fmt(prolaboreSvc)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-500">Imposto ({pct(impostoNum)})</span>
                        <span className="font-medium">{fmt(impostoSvc)}</span>
                      </div>
                    </>
                  )}
                  {mode === 'contrato' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Custos fixos</span>
                        <span className="font-medium">{fmt(fixoNum)}</span>
                      </div>
                      {prolaboreNum > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Seu salário</span>
                          <span className="font-medium">{fmt(prolaboreNum)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-500">Imposto ({pct(impostoNum)})</span>
                        <span className="font-medium">{fmt(impostoContr)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between border-t border-gray-100 pt-1.5">
                    <span className="text-gray-600 font-medium">{mode === 'atendimento' ? 'Lucro por atendimento' : 'Resultado mensal'}</span>
                    <span className={`font-bold ${lucro >= 0 ? 'text-[#0F40CB]' : 'text-red-500'}`}>{fmt(lucro)}</span>
                  </div>
                </div>

                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div className="h-3 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(0, Math.min(100, margem))}%`, backgroundColor: marginColor }} />
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-gray-700">Preços de referência</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-red-50 rounded-xl p-3">
                <p className="text-xs text-red-400 font-medium mb-0.5">Mínimo (apenas cobre custos)</p>
                <p className="text-xl font-bold text-red-600">{fmt(refMin > 0 ? refMin : 0)}</p>
                <p className="text-[10px] text-red-400 mt-0.5">Abaixo disso você tem prejuízo</p>
              </div>
              <div className="bg-[#0F40CB]/5 rounded-xl p-3">
                <p className="text-xs text-[#0F40CB] font-medium mb-0.5">Ideal (40% de margem)</p>
                <p className="text-xl font-bold text-[#0F40CB]">{fmt(refIdeal > 0 ? refIdeal : 0)}</p>
                <p className="text-[10px] text-[#0F40CB]/60 mt-0.5">Sustentável com espaço para crescer</p>
              </div>
              {refPreco > 0 && refIdeal > 0 && (
                <div className={`rounded-xl px-3 py-2 text-xs ${
                  refPreco >= refIdeal ? 'bg-[#B6F273]/10 text-[#0F40CB]'
                  : refPreco >= refMin  ? 'bg-amber-50 text-amber-700'
                  : 'bg-red-50 text-red-600'
                }`}>
                  {refPreco >= refIdeal
                    ? `✅ Seu preço está ${fmt(refPreco - refIdeal)} acima do ideal.`
                    : refPreco >= refMin
                    ? `⚠️ Cobre os custos, mas ${fmt(refIdeal - refPreco)} abaixo do ideal.`
                    : `🚨 Seu preço está ${fmt(refMin - refPreco)} abaixo do mínimo!`
                  }
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

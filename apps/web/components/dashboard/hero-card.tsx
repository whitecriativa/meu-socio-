'use client'

interface HeroCardProps {
  revenue:       number
  revenueYesterday: number
  goalTarget:    number
  goalPercent:   number
  vsLastMonth:   number  // % diferença vs mês passado
}

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

export function HeroCard({ revenue, revenueYesterday, goalTarget, goalPercent, vsLastMonth }: HeroCardProps) {
  const remaining = Math.max(0, goalTarget - revenue)
  const isPositive = vsLastMonth >= 0

  return (
    <div
      className="rounded-2xl p-5 md:p-6 text-white relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #5B3FD4 0%, #4A2FB8 100%)' }}
    >
      {/* Decoração */}
      <div className="absolute top-0 right-0 w-52 h-52 rounded-full bg-white/5 -translate-y-20 translate-x-20 pointer-events-none" />
      <div className="absolute bottom-0 left-8 w-32 h-32 rounded-full bg-[#52D68A]/10 translate-y-12 pointer-events-none" />

      <div className="relative">
        {/* Label */}
        <p className="text-white/60 text-xs font-medium tracking-wide uppercase mb-1">
          Faturamento do mês
        </p>

        {/* Valor grande */}
        <p className="text-4xl md:text-5xl font-bold tracking-tight leading-none mb-1">
          {fmt(revenue)}
        </p>

        {/* Linha de comparação */}
        <p className="text-white/70 text-sm mt-2 flex items-center gap-2 flex-wrap">
          <span>{fmt(revenueYesterday)} ontem</span>
          {vsLastMonth !== 0 && (
            <>
              <span className="text-white/30">·</span>
              <span className={isPositive ? 'text-[#52D68A]' : 'text-red-300'}>
                {isPositive ? '+' : ''}{vsLastMonth}% vs mês passado
              </span>
            </>
          )}
        </p>

        {/* Barra de progresso da meta */}
        {goalTarget > 0 && (
          <div className="mt-4">
            <div className="w-full bg-white/15 rounded-full h-2.5">
              <div
                className="h-2.5 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, goalPercent)}%`, backgroundColor: '#52D68A' }}
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-white/60 text-xs">
                <span className="text-white font-semibold">{goalPercent}%</span> da meta
                {remaining > 0 && <span className="text-white/50"> · faltam {fmt(remaining)}</span>}
              </p>
              {goalPercent >= 100 && (
                <span className="text-xs font-bold text-[#52D68A]">Meta batida! 🎉</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

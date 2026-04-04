interface FinancialHealthProps {
  revenue:  number
  expenses: number
}

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v)
}

export function FinancialHealth({ revenue, expenses }: FinancialHealthProps) {
  const profit = revenue - expenses
  const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0

  const cols = [
    { label: 'Receitas',  value: fmt(revenue),  color: '#B6F273', sub: 'este mês' },
    { label: 'Despesas',  value: fmt(expenses),  color: '#F87171', sub: 'este mês' },
    { label: 'Sobrou',    value: fmt(Math.max(0, profit)), color: profit >= 0 ? '#0F40CB' : '#F87171', sub: `${margin}% margem` },
  ]

  return (
    <div
      className="rounded-2xl p-4"
      style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>
        Saúde financeira
      </p>
      <div className="grid grid-cols-3 divide-x" style={{ '--tw-divide-opacity': 1 } as React.CSSProperties}>
        {cols.map(({ label, value, color, sub }) => (
          <div key={label} className="px-3 first:pl-0 last:pr-0 flex flex-col gap-0.5">
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{label}</p>
            <p className="text-base font-bold leading-tight" style={{ color }}>{value}</p>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{sub}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

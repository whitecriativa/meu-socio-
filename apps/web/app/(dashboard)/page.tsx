import { DashboardCards } from '@/components/dashboard/dashboard-cards'

// Dados mockados — substituir por chamadas Supabase quando o banco estiver pronto
const MOCK_DATA = {
  user: { name: 'Ana Lima' },
  metrics: {
    revenue: 680,
    expenses: 120,
    appointments_count: 4,
    new_clients: 2,
    avg_ticket: 170,
    active_clients: 42,
  },
  goal: {
    target_revenue: 8000,
    achieved_revenue: 5200,
    dream_note: 'Viagem pra Floripa em dezembro 🌊',
  },
  appointments: [
    {
      id: '1',
      service: 'Manicure + Pedicure',
      scheduled_at: new Date().toISOString().slice(0, 10) + 'T09:00:00',
      status: 'confirmado',
      clients: { name: 'Mariana Souza' },
    },
    {
      id: '2',
      service: 'Esmaltação em gel',
      scheduled_at: new Date().toISOString().slice(0, 10) + 'T10:30:00',
      status: 'confirmado',
      clients: { name: 'Camila Rocha' },
    },
    {
      id: '3',
      service: 'Manicure',
      scheduled_at: new Date().toISOString().slice(0, 10) + 'T14:00:00',
      status: 'confirmado',
      clients: { name: 'Fernanda Costa' },
    },
    {
      id: '4',
      service: 'Pedicure',
      scheduled_at: new Date().toISOString().slice(0, 10) + 'T16:00:00',
      status: 'confirmado',
      clients: { name: 'Juliana Melo' },
    },
  ],
}

export default function DashboardPage() {
  const { user, metrics, goal, appointments } = MOCK_DATA

  return (
    <div className="px-4 py-5 md:px-8 md:py-8 max-w-4xl">
      <header className="mb-6">
        <p className="text-sm text-gray-500">Bom dia,</p>
        <h1 className="text-xl font-bold text-gray-900 md:text-2xl">{user.name} 👋</h1>
      </header>

      <DashboardCards
        metrics={metrics}
        goal={goal}
        appointments={appointments}
      />
    </div>
  )
}

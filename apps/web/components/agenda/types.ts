export type AppointmentStatus = 'confirmado' | 'pendente' | 'cancelado' | 'concluido'

export interface Appointment {
  id: string
  date: string          // 'YYYY-MM-DD'
  time: string          // 'HH:MM'
  client_name: string
  service: string
  duration_min: number
  price: number
  status: AppointmentStatus
}

-- Migration 002: Tabela de custos fixos do negócio
-- Cada usuário cadastra seus custos recorrentes (aluguel, luz, internet, etc.)
-- A calculadora de precificação usa o total mensal normalizado automaticamente.

create table if not exists public.costs_fixed (
  id           uuid         primary key default gen_random_uuid(),
  user_id      uuid         not null references public.users(id) on delete cascade,
  name         text         not null,
  amount       numeric(10,2) not null check (amount > 0),
  periodicity  text         not null default 'mensal'
                            check (periodicity in ('mensal', 'semanal', 'anual')),
  category     text         not null default 'outro'
                            check (category in (
                              'aluguel', 'luz', 'agua', 'internet', 'telefone',
                              'software', 'funcionario', 'contador', 'outro'
                            )),
  created_at   timestamptz  not null default now()
);

alter table public.costs_fixed enable row level security;

create policy "owner_all" on public.costs_fixed
  for all
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Index para queries por user_id
create index if not exists costs_fixed_user_id_idx on public.costs_fixed(user_id);

-- Migration 003: Contratos parcelados
-- Permite registrar contratos com X parcelas.
-- Cada parcela é criada automaticamente ao criar o contrato.
-- Ao pagar uma parcela, um lançamento de receita é gerado automaticamente.

create table if not exists public.contracts (
  id                 uuid         primary key default gen_random_uuid(),
  user_id            uuid         not null references public.users(id) on delete cascade,
  client_name        text         not null,
  description        text         not null,
  total_amount       numeric(10,2) not null check (total_amount > 0),
  installments_count int          not null check (installments_count > 0),
  start_date         date         not null default current_date,
  status             text         not null default 'ativo'
                                  check (status in ('ativo', 'concluido', 'cancelado')),
  created_at         timestamptz  not null default now()
);

create table if not exists public.installments (
  id                 uuid         primary key default gen_random_uuid(),
  contract_id        uuid         not null references public.contracts(id) on delete cascade,
  user_id            uuid         not null references public.users(id) on delete cascade,
  installment_number int          not null,
  amount             numeric(10,2) not null check (amount > 0),
  due_date           date         not null,
  status             text         not null default 'pendente'
                                  check (status in ('pendente', 'pago', 'atrasado')),
  paid_at            timestamptz,
  created_at         timestamptz  not null default now()
);

alter table public.contracts    enable row level security;
alter table public.installments enable row level security;

create policy "owner_all" on public.contracts
  for all using  (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "owner_all" on public.installments
  for all using  (user_id = auth.uid()) with check (user_id = auth.uid());

create index if not exists contracts_user_id_idx    on public.contracts(user_id);
create index if not exists installments_contract_idx on public.installments(contract_id);
create index if not exists installments_user_id_idx  on public.installments(user_id);

-- Migration 012: catálogo de serviços do prestador
CREATE TABLE IF NOT EXISTS public.services (
  id          uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid         NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name        text         NOT NULL,
  price       numeric(10,2),
  duration_min integer,
  description text,
  active      boolean      NOT NULL DEFAULT true,
  created_at  timestamptz  NOT NULL DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_all" ON public.services
  FOR ALL
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS services_user_id_idx ON public.services(user_id);

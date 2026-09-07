ALTER TABLE public.consultorios
  ADD COLUMN IF NOT EXISTS medico3_nome text,
  ADD COLUMN IF NOT EXISTS medico3_crm text;
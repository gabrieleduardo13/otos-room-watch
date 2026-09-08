CREATE TABLE public.estoque_itens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_key text NOT NULL UNIQUE,
  quantidade integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.estoque_itens TO anon, authenticated;
GRANT ALL ON public.estoque_itens TO service_role;
ALTER TABLE public.estoque_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Estoque aberto para a equipe de TI" ON public.estoque_itens FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER update_estoque_itens_updated_at BEFORE UPDATE ON public.estoque_itens FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.estoque_movimentacoes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_key text NOT NULL,
  quantidade integer NOT NULL DEFAULT 1,
  tipo text NOT NULL DEFAULT 'baixa',
  destino text,
  motivo text,
  responsavel text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.estoque_movimentacoes TO anon, authenticated;
GRANT ALL ON public.estoque_movimentacoes TO service_role;
ALTER TABLE public.estoque_movimentacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Movimentacoes abertas para a equipe de TI" ON public.estoque_movimentacoes FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX estoque_mov_created_idx ON public.estoque_movimentacoes (created_at DESC);

INSERT INTO public.estoque_itens (item_key, quantidade) VALUES
  ('teclado_com_fio', 0),
  ('teclado_sem_fio', 0),
  ('mouse_com_fio', 0),
  ('mouse_sem_fio', 0);
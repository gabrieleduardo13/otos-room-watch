DELETE FROM public.historico;
DELETE FROM public.consultorios;

INSERT INTO public.consultorios (andar, numero) SELECT 'terreo', n::text FROM generate_series(1,12) AS n;
INSERT INTO public.consultorios (andar, numero) SELECT 'primeiro', n::text FROM generate_series(14,25) AS n;
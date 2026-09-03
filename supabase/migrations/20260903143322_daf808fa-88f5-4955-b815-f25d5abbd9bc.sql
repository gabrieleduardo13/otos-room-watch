CREATE TABLE public.consultorios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  andar text NOT NULL CHECK (andar IN ('terreo','primeiro','segundo')),
  numero text NOT NULL,
  especialidade text,
  medico1_nome text,
  medico1_crm text,
  medico2_nome text,
  medico2_crm text,
  cpu_status text NOT NULL DEFAULT 'OK' CHECK (cpu_status IN ('OK','Atenção','Problema')),
  cpu_obs text,
  monitor_status text NOT NULL DEFAULT 'OK' CHECK (monitor_status IN ('OK','Atenção','Problema')),
  monitor_obs text,
  estabilizador_status text NOT NULL DEFAULT 'OK' CHECK (estabilizador_status IN ('OK','Atenção','Problema')),
  estabilizador_obs text,
  perifericos_status text NOT NULL DEFAULT 'OK' CHECK (perifericos_status IN ('OK','Atenção','Problema')),
  perifericos_obs text,
  conexao_status text NOT NULL DEFAULT 'OK' CHECK (conexao_status IN ('OK','Atenção','Problema')),
  conexao_obs text,
  sistemas_status text NOT NULL DEFAULT 'OK' CHECK (sistemas_status IN ('OK','Atenção','Problema')),
  sistemas_obs text,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (andar, numero)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.consultorios TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consultorios TO authenticated;
GRANT ALL ON public.consultorios TO service_role;
ALTER TABLE public.consultorios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Consultorios abertos para a equipe de TI" ON public.consultorios FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultorio_id uuid NOT NULL REFERENCES public.consultorios(id) ON DELETE CASCADE,
  data date NOT NULL DEFAULT current_date,
  equipamento text NOT NULL,
  tipo text NOT NULL,
  descricao text NOT NULL,
  responsavel text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.historico TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.historico TO authenticated;
GRANT ALL ON public.historico TO service_role;
ALTER TABLE public.historico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Historico aberto para a equipe de TI" ON public.historico FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX historico_consultorio_idx ON public.historico (consultorio_id, data DESC, created_at DESC);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_consultorios_updated_at BEFORE UPDATE ON public.consultorios
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.consultorios (andar, numero, especialidade, medico1_nome, medico1_crm, medico2_nome, medico2_crm, cpu_status, monitor_status, estabilizador_status, perifericos_status, conexao_status, sistemas_status, observacoes) VALUES
('terreo','T-01','Otorrinolaringologia','Dra. Helena Prado','CRM-SP 48291','Dr. Caio Ferraz','CRM-SP 51077','OK','Problema','OK','OK','Atenção','OK','Monitor com manchas na tela; agendado para substituição. Conexão com queda intermitente no período da tarde.'),
('terreo','T-02','Audiologia','Dr. Marcos Vilela','CRM-SP 39812',NULL,NULL,'OK','OK','OK','OK','OK','OK',NULL),
('terreo','T-03','Otorrinolaringologia','Dra. Beatriz Nunes','CRM-SP 44120','Dr. Luiz Prado','CRM-SP 60233','OK','OK','Atenção','OK','OK','OK','Estabilizador com ruído leve; monitorar.'),
('terreo','T-04','Triagem','Dra. Camila Rocha','CRM-SP 51902',NULL,NULL,'OK','OK','OK','OK','OK','OK',NULL),
('terreo','T-05','Fonoaudiologia','Dra. Sofia Lemos','CRM-SP 47733',NULL,NULL,'OK','OK','OK','Atenção','OK','OK','Mouse com clique falhando.'),
('terreo','T-06','Otorrinolaringologia','Dr. Renato Alencar','CRM-SP 40551',NULL,NULL,'OK','OK','OK','OK','OK','OK',NULL),
('primeiro','1-01','Otorrinolaringologia','Dra. Paula Serra','CRM-SP 52110','Dr. André Bastos','CRM-SP 48830','OK','OK','OK','OK','OK','OK',NULL),
('primeiro','1-02','Alergologia','Dr. Vitor Campos','CRM-SP 43907',NULL,NULL,'Atenção','OK','OK','OK','OK','OK','CPU com lentidão ao abrir o prontuário.'),
('primeiro','1-03','Audiologia','Dra. Marina Faria','CRM-SP 55401',NULL,NULL,'OK','OK','OK','OK','Problema','OK','Sem sinal na tomada de rede desde 02/09.'),
('primeiro','1-04','Otorrinolaringologia','Dr. Rafael Barros','CRM-SP 49118',NULL,NULL,'OK','OK','OK','OK','OK','OK',NULL),
('primeiro','1-05','Cirurgia','Dra. Lívia Prado','CRM-SP 50044','Dr. Caio Ferraz','CRM-SP 51077','OK','OK','OK','OK','OK','Atenção','Sistema de imagens exige atualização de versão.'),
('primeiro','1-06','Otorrinolaringologia','Dr. Paulo Lima','CRM-SP 41276',NULL,NULL,'OK','OK','OK','OK','OK','OK',NULL),
('segundo','2-01','Otorrinolaringologia','Dra. Ana Souza','CRM-SP 53880',NULL,NULL,'OK','OK','OK','OK','OK','OK',NULL),
('segundo','2-02','Audiologia','Dr. Cristiano Mota','CRM-SP 46015',NULL,NULL,'OK','Atenção','OK','OK','OK','OK','Monitor oscilando o brilho.'),
('segundo','2-03','Otorrinolaringologia','Dra. Helena Ferraz','CRM-SP 48112','Dr. Marcos Vilela','CRM-SP 51904','OK','OK','OK','OK','Atenção','Problema','Sistemas sem sincronizar com o prontuário desde 09/09.'),
('segundo','2-04','Fonoaudiologia','Dra. Júlia Ramos','CRM-SP 54200',NULL,NULL,'OK','OK','OK','OK','OK','OK',NULL),
('segundo','2-05','Triagem','Dr. Eduardo Salles','CRM-SP 42998',NULL,NULL,'OK','OK','OK','OK','OK','OK',NULL),
('segundo','2-06','Otorrinolaringologia','Dra. Fernanda Cruz','CRM-SP 50877',NULL,NULL,'OK','OK','Atenção','OK','OK','OK','Estabilizador antigo, avaliar troca preventiva.');

INSERT INTO public.historico (consultorio_id, data, equipamento, tipo, descricao, responsavel)
SELECT c.id, d.data, d.equipamento, d.tipo, d.descricao, d.responsavel
FROM public.consultorios c
JOIN (VALUES
  ('T-01','2026-09-05'::date,'Conexão','Manutenção','Diagnóstico de rede — queda intermitente no período da tarde.','R. Almeida'),
  ('T-01','2026-09-03'::date,'Monitor','Troca de equipamento','Monitor substituído devido a manchas.','R. Almeida'),
  ('T-01','2026-09-01'::date,'Estabilizador','Substituição','Estabilizador antigo estava fazendo barulho.','P. Costa'),
  ('T-01','2026-08-28'::date,'Sistemas','Atualização','Backup do prontuário clínico verificado.','P. Costa'),
  ('1-03','2026-09-02'::date,'Conexão','Problema','Tomada de rede sem sinal; aberto chamado com a operadora.','R. Almeida'),
  ('2-03','2026-09-09'::date,'Sistemas','Configuração','Recarga do sistema de agendamento após falha de backup.','L. Prado'),
  ('2-03','2026-09-03'::date,'Monitor','Troca de equipamento','Monitor substituído devido a manchas permanentes.','R. Nunes')
) AS d(numero, data, equipamento, tipo, descricao, responsavel) ON d.numero = c.numero;
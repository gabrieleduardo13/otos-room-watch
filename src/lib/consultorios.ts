import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const STATUS_LIST = ["OK", "Atenção", "Problema"] as const;
export type Status = (typeof STATUS_LIST)[number];

export const ANDARES = [
  { slug: "terreo", label: "Térreo" },
  { slug: "primeiro", label: "1º Andar" },
  { slug: "segundo", label: "2º Andar" },
] as const;

export type AndarSlug = (typeof ANDARES)[number]["slug"];

export const EQUIPAMENTOS = [
  { key: "cpu", label: "CPU / Computador" },
  { key: "monitor", label: "Monitor" },
  { key: "estabilizador", label: "Estabilizador" },
  { key: "perifericos", label: "Teclado / Mouse" },
  { key: "conexao", label: "Conexão" },
  { key: "sistemas", label: "Sistemas" },
] as const;

export type EquipamentoKey = (typeof EQUIPAMENTOS)[number]["key"];

export const TIPOS_ALTERACAO = [
  "Troca de equipamento",
  "Substituição",
  "Manutenção",
  "Instalação",
  "Configuração",
  "Atualização",
  "Problema",
] as const;

export type Consultorio = {
  id: string;
  andar: AndarSlug;
  numero: string;
  especialidade: string | null;
  medico1_nome: string | null;
  medico1_crm: string | null;
  medico2_nome: string | null;
  medico2_crm: string | null;
  cpu_status: Status;
  cpu_obs: string | null;
  monitor_status: Status;
  monitor_obs: string | null;
  estabilizador_status: Status;
  estabilizador_obs: string | null;
  perifericos_status: Status;
  perifericos_obs: string | null;
  conexao_status: Status;
  conexao_obs: string | null;
  sistemas_status: Status;
  sistemas_obs: string | null;
  observacoes: string | null;
  updated_at: string;
};

export type Historico = {
  id: string;
  consultorio_id: string;
  data: string;
  equipamento: string;
  tipo: string;
  descricao: string;
  responsavel: string;
};

export function andarLabel(slug: string) {
  return ANDARES.find((a) => a.slug === slug)?.label ?? slug;
}

/** Situação atual do consultório = pior situação entre os equipamentos. */
export function situacaoAtual(c: Consultorio): Status {
  const all = EQUIPAMENTOS.map((e) => c[`${e.key}_status`] as Status);
  if (all.includes("Problema")) return "Problema";
  if (all.includes("Atenção")) return "Atenção";
  return "OK";
}

export function formatDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

export const consultoriosQuery = queryOptions({
  queryKey: ["consultorios"],
  queryFn: async (): Promise<Consultorio[]> => {
    const { data, error } = await supabase
      .from("consultorios")
      .select("*")
      .order("andar", { ascending: true })
      .order("numero", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as Consultorio[];
  },
});

export const consultorioQuery = (id: string) =>
  queryOptions({
    queryKey: ["consultorio", id],
    queryFn: async (): Promise<Consultorio | null> => {
      const { data, error } = await supabase
        .from("consultorios")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return (data as unknown as Consultorio) ?? null;
    },
  });

export const historicoQuery = (id: string) =>
  queryOptions({
    queryKey: ["historico", id],
    queryFn: async (): Promise<Historico[]> => {
      const { data, error } = await supabase
        .from("historico")
        .select("*")
        .eq("consultorio_id", id)
        .order("data", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as Historico[];
    },
  });

import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const ITENS_ESTOQUE = [
  { key: "teclado_com_fio", label: "Teclados com fio", curto: "Teclado", fio: "Com fio" },
  { key: "teclado_sem_fio", label: "Teclados sem fio", curto: "Teclado", fio: "Sem fio" },
  { key: "mouse_com_fio", label: "Mouses com fio", curto: "Mouse", fio: "Com fio" },
  { key: "mouse_sem_fio", label: "Mouses sem fio", curto: "Mouse", fio: "Sem fio" },
] as const;

export type ItemKey = (typeof ITENS_ESTOQUE)[number]["key"];

export function itemInfo(key: string) {
  return ITENS_ESTOQUE.find((i) => i.key === key);
}

export type EstoqueItem = { id: string; item_key: string; quantidade: number };

export type Movimentacao = {
  id: string;
  item_key: string;
  quantidade: number;
  tipo: string;
  destino: string | null;
  motivo: string | null;
  responsavel: string | null;
  created_at: string;
};

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const estoqueQuery = queryOptions({
  queryKey: ["estoque-itens"],
  queryFn: async (): Promise<EstoqueItem[]> => {
    const { data, error } = await supabase.from("estoque_itens").select("*");
    if (error) throw new Error(error.message);
    return (data ?? []) as EstoqueItem[];
  },
});

export const movimentacoesQuery = queryOptions({
  queryKey: ["estoque-movimentacoes"],
  queryFn: async (): Promise<Movimentacao[]> => {
    const { data, error } = await supabase
      .from("estoque_movimentacoes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return (data ?? []) as Movimentacao[];
  },
});

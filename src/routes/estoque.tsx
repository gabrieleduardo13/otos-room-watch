import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { consultoriosQuery } from "@/lib/consultorios";
import {
  ITENS_ESTOQUE,
  estoqueQuery,
  formatDateTime,
  itemInfo,
  movimentacoesQuery,
  type ItemKey,
} from "@/lib/estoque";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/estoque")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Controle de Estoque — Teclados e Mouses | OTOS" },
      {
        name: "description",
        content:
          "Saldo de teclados e mouses com e sem fio, registro de trocas e histórico de movimentações da equipe de TI da OTOS.",
      },
      { property: "og:title", content: "Controle de Estoque — Teclados e Mouses | OTOS" },
      {
        property: "og:description",
        content: "Saldo em estoque, baixas por consultório e histórico completo de movimentações.",
      },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(estoqueQuery);
    context.queryClient.ensureQueryData(movimentacoesQuery);
    context.queryClient.ensureQueryData(consultoriosQuery);
  },
  component: Estoque,
  errorComponent: ({ error }) => (
    <div role="alert" className="p-8 text-sm text-prob">
      Não foi possível carregar o estoque: {error instanceof Error ? error.message : "Erro inesperado"}
    </div>
  ),
  notFoundComponent: () => <div className="p-8 text-sm text-muted">Nada por aqui.</div>,
});

const inputClass =
  "w-full rounded-md bg-canvas px-2.5 py-2 text-sm text-ink ring-1 ring-line placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/40";
const labelClass = "block font-mono text-[10px] uppercase tracking-[0.15em] text-muted";

function Estoque() {
  const { data: itens } = useSuspenseQuery(estoqueQuery);
  const { data: movimentos } = useSuspenseQuery(movimentacoesQuery);
  const { data: consultorios } = useSuspenseQuery(consultoriosQuery);
  const queryClient = useQueryClient();

  const [ajustando, setAjustando] = useState(false);
  const [modal, setModal] = useState(false);

  const saldo = (key: string) => itens.find((i) => i.item_key === key)?.quantidade ?? 0;

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: ["estoque-itens"] });
    queryClient.invalidateQueries({ queryKey: ["estoque-movimentacoes"] });
  };

  const apagar = useMutation({
    mutationFn: async (id: string) => {
      const mov = movimentos.find((m) => m.id === id);
      if (!mov) return;
      const atual = saldo(mov.item_key);
      const novo = mov.tipo === "entrada" ? atual - mov.quantidade : atual + mov.quantidade;
      const up = await supabase
        .from("estoque_itens")
        .update({ quantidade: Math.max(0, novo) })
        .eq("item_key", mov.item_key);
      if (up.error) throw new Error(up.error.message);
      const del = await supabase.from("estoque_movimentacoes").delete().eq("id", id);
      if (del.error) throw new Error(del.error.message);
    },
    onSuccess: invalidar,
  });

  const total = ITENS_ESTOQUE.reduce((acc, i) => acc + saldo(i.key), 0);

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
            Teclados e mouses
          </p>
          <h1 className="mt-1 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            Controle de Estoque
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setAjustando((v) => !v)}
            className="rounded-md bg-panel px-3 py-2 text-sm font-medium text-ink ring-1 ring-line hover:bg-glow/10"
          >
            {ajustando ? "Fechar ajuste" : "Ajustar estoque"}
          </button>
          <button
            type="button"
            onClick={() => setModal(true)}
            className="rounded-md bg-brand px-3 py-2 text-sm font-medium text-panel hover:opacity-90"
          >
            Registrar troca / Dar baixa
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {ITENS_ESTOQUE.map((i) => (
          <div key={i.key} className="rounded-lg bg-panel p-4 ring-1 ring-black/5">
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
              {i.curto}
            </p>
            <p className="mt-1 text-sm font-medium tracking-tight">{i.fio}</p>
            <p className="mt-2 font-mono text-3xl font-semibold text-ink">{saldo(i.key)}</p>
            <p className="mt-1 text-xs text-muted">em estoque</p>
          </div>
        ))}
      </div>

      {ajustando && <AjustarEstoque saldo={saldo} onDone={() => setAjustando(false)} />}
      {modal && (
        <RegistrarModal
          consultorios={consultorios.map((c) => c.numero)}
          onClose={() => setModal(false)}
        />
      )}

      <div className="mt-8">
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            Histórico de movimentações
          </p>
          <span className="font-mono text-[10px] text-muted">
            {movimentos.length} registros · {total} itens em estoque
          </span>
        </div>

        <div className="mt-2 overflow-x-auto rounded-lg bg-panel ring-1 ring-black/5">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                {["Data e hora", "Item", "Destino", "Motivo", "Responsável", ""].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2 font-mono text-[10px] uppercase tracking-[0.15em] font-medium text-muted"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {movimentos.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-sm text-muted">
                    Nenhuma movimentação registrada ainda.
                  </td>
                </tr>
              )}
              {movimentos.map((m) => {
                const info = itemInfo(m.item_key);
                const entrada = m.tipo === "entrada";
                return (
                  <tr key={m.id} className="align-top">
                    <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs">
                      {formatDateTime(m.created_at)}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="flex flex-wrap items-center gap-1.5">
                        <span className="font-medium">
                          {info?.curto ?? m.item_key} ×{m.quantidade}
                        </span>
                        <span className="rounded bg-glow/15 px-1.5 py-0.5 font-mono text-[10px] text-ink/70">
                          {info?.fio ?? "—"}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-medium ${
                            entrada ? "bg-ok/10 text-ok" : "bg-prob/10 text-prob"
                          }`}
                        >
                          {entrada ? "Entrada" : "Baixa"}
                        </span>
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-sm">{m.destino || "—"}</td>
                    <td className="px-3 py-2.5 text-sm text-pretty">{m.motivo || "—"}</td>
                    <td className="px-3 py-2.5 text-sm">{m.responsavel || "—"}</td>
                    <td className="px-3 py-2.5 text-right">
                      <DesfazerBotao
                        pendente={apagar.isPending}
                        onConfirm={() => apagar.mutate(m.id)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {apagar.isError && (
          <p className="mt-2 text-xs text-prob">Não foi possível desfazer o registro.</p>
        )}
      </div>
    </AppShell>
  );
}

function DesfazerBotao({ onConfirm, pendente }: { onConfirm: () => void; pendente: boolean }) {
  const [confirmar, setConfirmar] = useState(false);
  if (!confirmar) {
    return (
      <button
        type="button"
        onClick={() => setConfirmar(true)}
        className="rounded px-2 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-muted hover:bg-prob/10 hover:text-prob"
      >
        Desfazer
      </button>
    );
  }
  return (
    <span className="flex justify-end gap-1">
      <button
        type="button"
        disabled={pendente}
        onClick={onConfirm}
        className="rounded bg-prob px-2 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-panel disabled:opacity-60"
      >
        {pendente ? "…" : "Confirmar"}
      </button>
      <button
        type="button"
        onClick={() => setConfirmar(false)}
        className="rounded px-2 py-1 font-mono text-[10px] uppercase tracking-[0.15em] text-muted hover:bg-canvas"
      >
        Cancelar
      </button>
    </span>
  );
}

function AjustarEstoque({
  saldo,
  onDone,
}: {
  saldo: (key: string) => number;
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const [valores, setValores] = useState<Record<string, string>>(() =>
    Object.fromEntries(ITENS_ESTOQUE.map((i) => [i.key, String(saldo(i.key))])),
  );

  const salvar = useMutation({
    mutationFn: async () => {
      for (const i of ITENS_ESTOQUE) {
        const q = Math.max(0, Number(valores[i.key] ?? 0) || 0);
        const { error } = await supabase
          .from("estoque_itens")
          .update({ quantidade: q })
          .eq("item_key", i.key);
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estoque-itens"] });
      onDone();
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        salvar.mutate();
      }}
      className="mt-4 rounded-lg bg-panel p-4 ring-1 ring-black/5"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
        Ajustar quantidades em estoque
      </p>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {ITENS_ESTOQUE.map((i) => (
          <label key={i.key} className="space-y-1">
            <span className={labelClass}>{i.label}</span>
            <input
              type="number"
              min={0}
              value={valores[i.key] ?? "0"}
              onChange={(e) => setValores((v) => ({ ...v, [i.key]: e.target.value }))}
              className={inputClass}
            />
          </label>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="submit"
          disabled={salvar.isPending}
          className="rounded-md bg-brand px-3 py-2 text-sm font-medium text-panel disabled:opacity-60"
        >
          {salvar.isPending ? "Salvando…" : "Salvar quantidades"}
        </button>
        {salvar.isError && <span className="text-xs text-prob">Não foi possível salvar.</span>}
      </div>
    </form>
  );
}

function RegistrarModal({
  consultorios,
  onClose,
}: {
  consultorios: string[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [item, setItem] = useState<ItemKey>("teclado_com_fio");
  const [tipo, setTipo] = useState<"baixa" | "entrada">("baixa");
  const [quantidade, setQuantidade] = useState("1");
  const [destino, setDestino] = useState("");
  const [motivo, setMotivo] = useState("");
  const [responsavel, setResponsavel] = useState("");

  const registrar = useMutation({
    mutationFn: async () => {
      const q = Math.max(1, Number(quantidade) || 1);
      const atual = await supabase
        .from("estoque_itens")
        .select("quantidade")
        .eq("item_key", item)
        .maybeSingle();
      if (atual.error) throw new Error(atual.error.message);
      const base = atual.data?.quantidade ?? 0;
      const novo = tipo === "entrada" ? base + q : Math.max(0, base - q);
      const up = await supabase
        .from("estoque_itens")
        .update({ quantidade: novo })
        .eq("item_key", item);
      if (up.error) throw new Error(up.error.message);
      const ins = await supabase.from("estoque_movimentacoes").insert({
        item_key: item,
        quantidade: q,
        tipo,
        destino: destino.trim() || null,
        motivo: motivo.trim() || null,
        responsavel: responsavel.trim() || null,
      });
      if (ins.error) throw new Error(ins.error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estoque-itens"] });
      queryClient.invalidateQueries({ queryKey: ["estoque-movimentacoes"] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center">
      <div
        role="dialog"
        aria-label="Registrar troca ou baixa"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-panel p-5 ring-1 ring-black/10"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
              Movimentação de estoque
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight">Registrar troca / baixa</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 py-1 font-mono text-xs text-muted hover:bg-canvas"
          >
            Fechar
          </button>
        </div>

        <form
          className="mt-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            registrar.mutate();
          }}
        >
          <label className="block space-y-1">
            <span className={labelClass}>Item retirado</span>
            <select
              value={item}
              onChange={(e) => setItem(e.target.value as ItemKey)}
              className={inputClass}
            >
              {ITENS_ESTOQUE.map((i) => (
                <option key={i.key} value={i.key}>
                  {i.curto} {i.fio.toLowerCase()}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className={labelClass}>Tipo</span>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as "baixa" | "entrada")}
                className={inputClass}
              >
                <option value="baixa">Baixa (saída)</option>
                <option value="entrada">Entrada</option>
              </select>
            </label>
            <label className="block space-y-1">
              <span className={labelClass}>Quantidade</span>
              <input
                type="number"
                min={1}
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                className={inputClass}
              />
            </label>
          </div>

          <label className="block space-y-1">
            <span className={labelClass}>Destino / consultório</span>
            <input
              list="destinos-consultorios"
              value={destino}
              onChange={(e) => setDestino(e.target.value)}
              placeholder="Ex.: Consultório 07, Recepção…"
              className={inputClass}
            />
            <datalist id="destinos-consultorios">
              {consultorios.map((n) => (
                <option key={n} value={`Consultório ${n}`} />
              ))}
            </datalist>
          </label>

          <label className="block space-y-1">
            <span className={labelClass}>Motivo da troca</span>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={2}
              placeholder="Ex.: defeito no clique, cabo quebrado, tecla falhando…"
              className={inputClass}
            />
          </label>

          <label className="block space-y-1">
            <span className={labelClass}>Responsável</span>
            <input
              value={responsavel}
              onChange={(e) => setResponsavel(e.target.value)}
              placeholder="Quem realizou a troca"
              className={inputClass}
            />
          </label>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={registrar.isPending}
              className="rounded-md bg-brand px-3 py-2 text-sm font-medium text-panel disabled:opacity-60"
            >
              {registrar.isPending ? "Salvando…" : "Confirmar movimentação"}
            </button>
            {registrar.isError && (
              <span className="text-xs text-prob">Não foi possível registrar.</span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

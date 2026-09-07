import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import {
  EQUIPAMENTOS,
  STATUS_LIST,
  TIPOS_ALTERACAO,
  andarLabel,
  consultorioQuery,
  consultoriosQuery,
  formatDate,
  historicoQuery,
  situacaoAtual,
  type Consultorio,
  type Status,
} from "@/lib/consultorios";

export const Route = createFileRoute("/consultorio/$id")({
  head: () => ({
    meta: [
      { title: "Consultório — Consultórios OTOS" },
      {
        name: "description",
        content:
          "Ficha completa do consultório: médicos, equipamentos de informática, situação atual, observações e histórico de alterações.",
      },
      { property: "og:title", content: "Ficha do consultório — Consultórios OTOS" },
      {
        property: "og:description",
        content: "Equipamentos, situação atual e histórico de alterações do consultório.",
      },
    ],
  }),
  loader: ({ context, params }) => {
    context.queryClient.ensureQueryData(consultorioQuery(params.id));
    context.queryClient.ensureQueryData(historicoQuery(params.id));
  },
  component: ConsultorioDetalhe,
  errorComponent: ({ error }) => (
    <div role="alert" className="p-8 text-sm text-prob">
      Não foi possível carregar o consultório: {error.message}
    </div>
  ),
  notFoundComponent: () => (
    <div className="p-8 text-sm text-muted">Consultório não encontrado.</div>
  ),
});

const label = "font-mono text-[10px] uppercase tracking-[0.18em] text-muted";
const field =
  "w-full rounded-md bg-panel px-3 py-2 text-sm text-ink ring-1 ring-black/5 focus:outline-none focus:ring-2 focus:ring-brand/40";

function ConsultorioDetalhe() {
  const { id } = Route.useParams();
  const { data: consultorio } = useSuspenseQuery(consultorioQuery(id));
  const { data: historico } = useSuspenseQuery(historicoQuery(id));
  const queryClient = useQueryClient();

  const [form, setForm] = useState<Consultorio | null>(consultorio);
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    setForm(consultorio);
  }, [consultorio]);

  const salvar = useMutation({
    mutationFn: async (dados: Consultorio) => {
      const { id: _id, updated_at: _u, ...campos } = dados;
      const { error } = await supabase.from("consultorios").update(campos).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consultorio", id] });
      queryClient.invalidateQueries({ queryKey: consultoriosQuery.queryKey });
      setSalvo(true);
      window.setTimeout(() => setSalvo(false), 2500);
    },
  });

  if (!consultorio || !form) {
    return (
      <AppShell>
        <p className="text-sm text-muted">Consultório não encontrado.</p>
      </AppShell>
    );
  }

  const set = <K extends keyof Consultorio>(key: K, value: Consultorio[K]) =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  return (
    <AppShell>
      <Link to="/andar/$andar" params={{ andar: consultorio.andar }} className={`${label} hover:text-ink`}>
        ← {andarLabel(consultorio.andar)}
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 min-w-11 place-items-center whitespace-nowrap rounded-md bg-brand px-2 text-center font-mono text-sm font-semibold text-panel">
            {consultorio.numero}
          </span>
          <div className="leading-tight">
            <h1 className="text-xl font-semibold tracking-tight">
              Consultório {consultorio.numero}
            </h1>
            <p className="text-xs text-muted">
              {andarLabel(consultorio.andar)}
              {consultorio.especialidade ? ` · ${consultorio.especialidade}` : ""}
            </p>
          </div>
        </div>
        <StatusBadge status={situacaoAtual(consultorio)} size="lg" />
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        <div>
          <p className={label}>Médicos (até 3)</p>
          <div className="mt-2 space-y-2">
            {([1, 2, 3] as const).map((n) => (
              <div key={n} className="flex gap-2">
                <input
                  className={field}
                  placeholder={`Nome do médico ${n}`}
                  aria-label={`Nome do médico ${n}`}
                  value={form[`medico${n}_nome`] ?? ""}
                  onChange={(e) => set(`medico${n}_nome`, e.target.value || null)}
                />
                <input
                  className={`${field} max-w-[9.5rem] font-mono text-xs`}
                  placeholder="CRM"
                  aria-label={`CRM do médico ${n}`}
                  value={form[`medico${n}_crm`] ?? ""}
                  onChange={(e) => set(`medico${n}_crm`, e.target.value || null)}
                />
              </div>
            ))}
          </div>

          <p className={`mt-5 ${label}`}>Equipamentos</p>
          <div className="mt-2 divide-y divide-line overflow-hidden rounded-lg bg-panel ring-1 ring-black/5">
            {EQUIPAMENTOS.map((e) => (
              <div key={e.key} className="px-3 py-2.5 hover:bg-glow/5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm">{e.label}</span>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={form[`${e.key}_status`] as Status} />
                    <select
                      aria-label={`Situação de ${e.label}`}
                      className="rounded-md border border-line bg-canvas px-2 py-1 font-mono text-[11px] text-ink focus:outline-none focus:ring-2 focus:ring-brand/40"
                      value={form[`${e.key}_status`] as Status}
                      onChange={(ev) => set(`${e.key}_status`, ev.target.value as Status)}
                    >
                      {STATUS_LIST.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <input
                  className="mt-2 w-full rounded-md border border-line bg-canvas px-2 py-1.5 text-xs text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/40"
                  placeholder={`Detalhe do ${e.label.toLowerCase()} (modelo, patrimônio, observação)`}
                  aria-label={`Observação de ${e.label}`}
                  value={form[`${e.key}_obs`] ?? ""}
                  onChange={(ev) => set(`${e.key}_obs`, ev.target.value || null)}
                />
              </div>
            ))}
          </div>

          <p className={`mt-5 ${label}`}>Observações</p>
          <textarea
            className={`mt-2 min-h-24 ${field}`}
            aria-label="Observações do consultório"
            placeholder="Notas gerais da equipe de TI…"
            value={form.observacoes ?? ""}
            onChange={(e) => set("observacoes", e.target.value || null)}
          />

          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={() => salvar.mutate(form)}
              disabled={salvar.isPending}
              className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-panel disabled:opacity-60"
            >
              {salvar.isPending ? "Salvando…" : "Salvar alterações"}
            </button>
            {salvo && <span className="font-mono text-[11px] text-ok">Dados salvos</span>}
            {salvar.isError && (
              <span className="font-mono text-[11px] text-prob">{salvar.error.message}</span>
            )}
          </div>
        </div>

        <div>
          <p className={label}>Histórico de alterações</p>
          <div className="mt-2 divide-y divide-line overflow-hidden rounded-lg bg-panel ring-1 ring-black/5">
            {historico.length === 0 && (
              <p className="px-3 py-3 text-sm text-muted">Nenhuma alteração registrada.</p>
            )}
            {historico.map((h) => (
              <div key={h.id} className="px-3 py-3 hover:bg-glow/5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-medium text-ink">{formatDate(h.data)}</span>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-glow/15 px-2 py-0.5 font-mono text-[10px] font-medium text-ink/70">
                      {h.equipamento}
                    </span>
                    <ApagarRegistro registroId={h.id} consultorioId={id} />
                  </div>
                </div>
                <p className="mt-1 text-sm text-pretty">
                  {h.tipo} — {h.descricao}
                </p>
                <p className="mt-1 font-mono text-[10px] text-muted">Responsável: {h.responsavel}</p>
              </div>
            ))}
          </div>

          <NovoRegistro consultorioId={id} />
        </div>

      </div>
    </AppShell>
  );
}

function ApagarRegistro({
  registroId,
  consultorioId,
}: {
  registroId: string;
  consultorioId: string;
}) {
  const queryClient = useQueryClient();
  const [confirmar, setConfirmar] = useState(false);

  const apagar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("historico").delete().eq("id", registroId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["historico", consultorioId] });
      queryClient.invalidateQueries({ queryKey: ["historico-recente"] });
    },
  });

  if (!confirmar) {
    return (
      <button
        type="button"
        aria-label="Apagar este registro"
        title="Apagar este registro"
        onClick={() => setConfirmar(true)}
        className="rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em] text-muted hover:bg-prob/10 hover:text-prob"
      >
        Apagar
      </button>
    );
  }

  return (
    <span className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => apagar.mutate()}
        disabled={apagar.isPending}
        className="rounded bg-prob px-1.5 py-0.5 font-mono text-[10px] font-medium text-panel disabled:opacity-60"
      >
        {apagar.isPending ? "…" : "Confirmar"}
      </button>
      <button
        type="button"
        onClick={() => setConfirmar(false)}
        className="rounded px-1.5 py-0.5 font-mono text-[10px] text-muted hover:text-ink"
      >
        Cancelar
      </button>
    </span>
  );
}

function NovoRegistro({ consultorioId }: { consultorioId: string }) {

  const queryClient = useQueryClient();
  const hoje = new Date().toISOString().slice(0, 10);
  const [data, setData] = useState(hoje);
  const [equipamento, setEquipamento] = useState<string>(EQUIPAMENTOS[0].label);
  const [tipo, setTipo] = useState<string>(TIPOS_ALTERACAO[0]);
  const [descricao, setDescricao] = useState("");
  const [responsavel, setResponsavel] = useState("");

  const registrar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("historico").insert({
        consultorio_id: consultorioId,
        data,
        equipamento,
        tipo,
        descricao,
        responsavel,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["historico", consultorioId] });
      setDescricao("");
      setData(hoje);
    },
  });

  const valido = descricao.trim().length > 0 && responsavel.trim().length > 0;

  return (
    <form
      className="mt-5 rounded-lg bg-panel p-4 ring-1 ring-black/5"
      onSubmit={(e) => {
        e.preventDefault();
        if (valido) registrar.mutate();
      }}
    >
      <p className={label}>Registrar alteração</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <input
          type="date"
          className={`${field} font-mono text-xs`}
          aria-label="Data da alteração"
          value={data}
          onChange={(e) => setData(e.target.value)}
        />
        <select
          className={`${field} text-xs`}
          aria-label="Equipamento afetado"
          value={equipamento}
          onChange={(e) => setEquipamento(e.target.value)}
        >
          {EQUIPAMENTOS.map((e) => (
            <option key={e.key} value={e.label}>
              {e.label}
            </option>
          ))}
        </select>
        <select
          className={`${field} text-xs sm:col-span-2`}
          aria-label="Tipo de alteração"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
        >
          {TIPOS_ALTERACAO.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <textarea
          className={`${field} min-h-20 sm:col-span-2`}
          aria-label="Descrição da alteração"
          placeholder="Descrição — ex.: Monitor substituído devido a manchas."
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />
        <input
          className={`${field} sm:col-span-2`}
          aria-label="Responsável pela alteração"
          placeholder="Responsável pela alteração"
          value={responsavel}
          onChange={(e) => setResponsavel(e.target.value)}
        />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="submit"
          disabled={!valido || registrar.isPending}
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-panel disabled:opacity-60"
        >
          {registrar.isPending ? "Registrando…" : "Registrar"}
        </button>
        {registrar.isError && (
          <span className="font-mono text-[11px] text-prob">{registrar.error.message}</span>
        )}
      </div>
    </form>
  );
}

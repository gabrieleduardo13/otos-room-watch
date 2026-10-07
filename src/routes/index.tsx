import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { StatusBadge, StatusDot } from "@/components/StatusBadge";
import {
  ANDARES,
  consultoriosQuery,
  formatDate,
  historicoRecenteQuery,
  situacaoAtual,
  type Status,
} from "@/lib/consultorios";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Consultórios OTOS — Painel de equipamentos de TI" },
      {
        name: "description",
        content:
          "Painel da equipe de TI da clínica OTOS: situação dos equipamentos dos consultórios do térreo, 1º e 2º andar.",
      },
      { property: "og:title", content: "Consultórios OTOS — Painel de equipamentos de TI" },
      {
        property: "og:description",
        content: "Acompanhe CPU, monitor, estabilizador, periféricos, conexão e sistemas por consultório.",
      },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(consultoriosQuery);
    context.queryClient.ensureQueryData(historicoRecenteQuery);
  },
  component: VisaoGeral,
  errorComponent: ({ error }) => (
    <div role="alert" className="p-8 text-sm text-prob">
      Não foi possível carregar os consultórios: {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="p-8 text-sm text-muted">Nada por aqui.</div>,
});

function VisaoGeral() {
  const { data: consultorios } = useSuspenseQuery(consultoriosQuery);
  const { data: recentes } = useSuspenseQuery(historicoRecenteQuery);
  const [busca, setBusca] = useState("");

  const termo = busca.trim().toLowerCase();
  const resultados = useMemo(() => {
    if (!termo) return [];
    return consultorios.filter((c) =>
      [c.numero, c.medico1_nome, c.medico2_nome, c.medico3_nome, c.especialidade]
        .filter(Boolean)
        .some((v) => (v as string).toLowerCase().includes(termo)),
    );
  }, [consultorios, termo]);

  const contagem = consultorios.reduce<Record<Status, number>>(
    (acc, c) => {
      acc[situacaoAtual(c)] += 1;
      return acc;
    },
    { OK: 0, "Atenção": 0, Problema: 0 },
  );

  const atualizado = consultorios.reduce(
    (max, c) => (c.updated_at > max ? c.updated_at : max),
    consultorios[0]?.updated_at ?? new Date().toISOString(),
  );

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
            Painel de andares
          </p>
          <h1 className="mt-1 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            Consultórios OTOS
          </h1>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-panel px-3 py-1.5 ring-1 ring-black/5">
          <span className="font-mono text-xs text-muted">Atualizado</span>
          <span className="font-mono text-xs font-medium text-ink">{formatDate(atualizado)}</span>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3 rounded-lg bg-panel px-3 py-2.5 ring-1 ring-black/5">
        <span className="grid size-4 shrink-0 place-items-center font-mono text-muted">/</span>
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar consultório ou médico…"
          aria-label="Buscar consultório ou médico"
          className="w-full bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
        />
        <span className="hidden font-mono text-[10px] uppercase tracking-[0.15em] text-muted sm:block">
          {termo ? `Resultados: ${resultados.length}` : `Total: ${consultorios.length}`}
        </span>
      </div>

      {termo && (
        <div className="mt-3 divide-y divide-line overflow-hidden rounded-lg bg-panel ring-1 ring-black/5">
          {resultados.length === 0 && (
            <p className="px-3 py-3 text-sm text-muted">Nenhum consultório ou médico encontrado.</p>
          )}
          {resultados.map((c) => (
            <Link
              key={c.id}
              to="/consultorio/$id"
              params={{ id: c.id }}
              className="flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-glow/5"
            >
              <span className="min-w-0">
                <span className="block text-sm font-medium">Consultório {c.numero}</span>
                <span className="block truncate text-xs text-muted">
                  {[c.medico1_nome, c.medico2_nome, c.medico3_nome].filter(Boolean).join(" · ") || "Sem médicos"}
                </span>
              </span>
              <span className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
                  {ANDARES.find((a) => a.slug === c.andar)?.label}
                </span>
                <StatusBadge status={situacaoAtual(c)} />
              </span>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-panel p-4 ring-1 ring-ok/20">
          <div className="flex items-center gap-2">
            <StatusDot status="OK" />
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
              Situação OK
            </p>
          </div>
          <p className="mt-2 font-mono text-3xl font-semibold text-ok">{contagem.OK}</p>
          <p className="mt-1 text-xs text-muted">consultórios sem pendências</p>
        </div>
        <div className="rounded-lg bg-panel p-4 ring-1 ring-attn/20">
          <div className="flex items-center gap-2">
            <StatusDot status="Atenção" />
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">Atenção</p>
          </div>
          <p className="mt-2 font-mono text-3xl font-semibold text-attn">{contagem["Atenção"]}</p>
          <p className="mt-1 text-xs text-muted">monitorar de perto</p>
        </div>
        <div className="rounded-lg bg-panel p-4 ring-1 ring-prob/20">
          <div className="flex items-center gap-2">
            <StatusDot status="Problema" />
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">Problema</p>
          </div>
          <p className="mt-2 font-mono text-3xl font-semibold text-prob">{contagem.Problema}</p>
          <p className="mt-1 text-xs text-muted">ação imediata</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {ANDARES.map((andar) => {
          const doAndar = consultorios.filter((c) => c.andar === andar.slug);
          const porStatus = doAndar.reduce<Record<Status, number>>(
            (acc, c) => {
              acc[situacaoAtual(c)] += 1;
              return acc;
            },
            { OK: 0, "Atenção": 0, Problema: 0 },
          );
          return (
            <Link
              key={andar.slug}
              to="/andar/$andar"
              params={{ andar: andar.slug }}
              className="block rounded-lg bg-panel p-4 ring-1 ring-black/5 transition-transform hover:-translate-y-0.5"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">Andar</p>
              <p className="mt-1 text-lg font-semibold tracking-tight">{andar.label}</p>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="font-mono text-2xl font-semibold text-ink">{doAndar.length}</span>
                <span className="text-xs text-muted">consultórios</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {porStatus.OK > 0 && (
                  <span className="rounded bg-ok/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-ok">
                    {porStatus.OK} OK
                  </span>
                )}
                {porStatus["Atenção"] > 0 && (
                  <span className="rounded bg-attn/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-attn">
                    {porStatus["Atenção"]} atenção
                  </span>
                )}
                {porStatus.Problema > 0 && (
                  <span className="rounded bg-prob/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-prob">
                    {porStatus.Problema} problema
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            Últimas alterações
          </p>
          <span className="font-mono text-[10px] text-muted">{recentes.length} registros</span>
        </div>
        <div className="mt-2 divide-y divide-line overflow-hidden rounded-lg bg-panel ring-1 ring-black/5">
          {recentes.length === 0 && (
            <p className="px-3 py-3 text-sm text-muted">Nenhuma alteração registrada ainda.</p>
          )}
          {recentes.map((h) => (
            <Link
              key={h.id}
              to="/consultorio/$id"
              params={{ id: h.consultorio_id }}
              className="block px-3 py-3 hover:bg-glow/5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-medium text-ink">{formatDate(h.data)}</span>
                <span className="rounded bg-brand/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-brand">
                  Consultório {h.consultorios?.numero ?? "—"}
                </span>
                <span className="rounded bg-glow/15 px-1.5 py-0.5 font-mono text-[10px] text-ink/70">
                  {h.equipamento}
                </span>
              </div>
              <p className="mt-1 text-sm text-pretty">
                {h.tipo} — {h.descricao}
              </p>
              <p className="mt-1 font-mono text-[10px] text-muted">Responsável: {h.responsavel}</p>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}


import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import {
  ANDARES,
  EQUIPAMENTOS,
  andarLabel,
  consultoriosQuery,
  situacaoAtual,
  type Status,
} from "@/lib/consultorios";

export const Route = createFileRoute("/andar/$andar")({
  head: ({ params }) => {
    const label = andarLabel(params.andar);
    return {
      meta: [
        { title: `${label} — Consultórios OTOS` },
        {
          name: "description",
          content: `Consultórios do ${label} da clínica OTOS e a situação dos equipamentos de informática.`,
        },
        { property: "og:title", content: `${label} — Consultórios OTOS` },
        {
          property: "og:description",
          content: `Situação dos equipamentos por consultório no ${label}.`,
        },
      ],
    };
  },
  loader: ({ context, params }) => {
    if (!ANDARES.some((a) => a.slug === params.andar)) throw notFound();
    context.queryClient.ensureQueryData(consultoriosQuery);
  },
  component: AndarPage,
  errorComponent: ({ error }) => (
    <div role="alert" className="p-8 text-sm text-prob">
      Não foi possível carregar este andar: {error.message}
    </div>
  ),
  notFoundComponent: () => (
    <div className="p-8 text-sm text-muted">Andar não encontrado.</div>
  ),
});

function AndarPage() {
  const { andar } = Route.useParams();
  const { data: consultorios } = useSuspenseQuery(consultoriosQuery);
  const doAndar = consultorios.filter((c) => c.andar === andar);

  const porStatus = doAndar.reduce<Record<Status, number>>(
    (acc, c) => {
      acc[situacaoAtual(c)] += 1;
      return acc;
    },
    { OK: 0, "Atenção": 0, Problema: 0 },
  );

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">Andar</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{andarLabel(andar)}</h1>
          <p className="mt-1 text-xs text-muted">{doAndar.length} consultórios neste andar</p>
        </div>
        <div className="flex gap-1">
          <span className="rounded bg-ok/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-ok">
            {porStatus.OK} OK
          </span>
          <span className="rounded bg-attn/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-attn">
            {porStatus["Atenção"]} atenção
          </span>
          <span className="rounded bg-prob/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-prob">
            {porStatus.Problema} problema
          </span>
        </div>
      </div>

      <div className="mt-5 divide-y divide-line overflow-hidden rounded-lg bg-panel ring-1 ring-black/5">
        {doAndar.map((c) => (
          <Link
            key={c.id}
            to="/consultorio/$id"
            params={{ id: c.id }}
            className="flex flex-wrap items-center justify-between gap-3 px-3 py-3 hover:bg-glow/5"
          >
            <span className="flex items-center gap-3">
              <span className="grid h-10 min-w-10 place-items-center whitespace-nowrap rounded-md bg-brand px-2 text-center font-mono text-xs font-semibold text-panel">
                {c.numero}
              </span>
              <span className="leading-tight">
                <span className="block text-sm font-medium">Consultório {c.numero}</span>
                <span className="block text-xs text-muted">
                  {[c.medico1_nome, c.medico2_nome].filter(Boolean).join(" · ") || "Sem médicos cadastrados"}
                </span>
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              {EQUIPAMENTOS.map((e) => {
                const status = c[`${e.key}_status`] as Status;
                const bg =
                  status === "OK" ? "bg-ok/70" : status === "Atenção" ? "bg-attn/80" : "bg-prob/80";
                return (
                  <span
                    key={e.key}
                    title={`${e.label}: ${status}`}
                    className={`h-4 w-2.5 rounded-sm ${bg}`}
                  />
                );
              })}
              <span className="ml-2">
                <StatusBadge status={situacaoAtual(c)} />
              </span>
            </span>
          </Link>
        ))}
        {doAndar.length === 0 && (
          <p className="px-3 py-4 text-sm text-muted">Nenhum consultório cadastrado neste andar.</p>
        )}
      </div>
    </AppShell>
  );
}

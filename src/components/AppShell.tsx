import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ANDARES, consultoriosQuery } from "@/lib/consultorios";

export function AppShell({ children }: { children: ReactNode }) {
  const { data: consultorios } = useSuspenseQuery(consultoriosQuery);

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-8 lg:grid-cols-12">
        <aside className="lg:col-span-3">
          <div className="flex flex-col gap-6 lg:sticky lg:top-8">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-md bg-brand font-mono text-sm font-semibold text-panel">
                O
              </span>
              <span className="leading-tight">
                <span className="block text-sm font-semibold tracking-tight">OTOS</span>
                <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                  Gestão de TI
                </span>
              </span>
            </Link>

            <nav className="space-y-1">
              <Link
                to="/"
                activeOptions={{ exact: true }}
                activeProps={{ className: "block rounded-md bg-brand px-3 py-2 text-sm font-medium text-panel" }}
                inactiveProps={{ className: "block rounded-md px-3 py-2 text-sm text-ink hover:bg-panel" }}
              >
                Visão geral
              </Link>
              {ANDARES.map((andar) => (
                <Link
                  key={andar.slug}
                  to="/andar/$andar"
                  params={{ andar: andar.slug }}
                  activeProps={{
                    className:
                      "flex items-center justify-between rounded-md bg-brand px-3 py-2 text-sm font-medium text-panel",
                  }}
                  inactiveProps={{
                    className:
                      "flex items-center justify-between rounded-md px-3 py-2 text-sm text-ink hover:bg-panel",
                  }}
                >
                  <span>{andar.label}</span>
                  <span className="font-mono text-xs opacity-70">
                    {consultorios.filter((c) => c.andar === andar.slug).length}
                  </span>
                </Link>
              ))}
            </nav>

            <div className="rounded-lg bg-panel p-3 ring-1 ring-black/5">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                Equipe de TI
              </p>
              <p className="mt-1 text-sm font-medium">{consultorios.length} consultórios</p>
              <p className="text-xs text-muted">Inventário monitorado</p>
            </div>
          </div>
        </aside>

        <main className="lg:col-span-9">{children}</main>
      </div>
    </div>
  );
}

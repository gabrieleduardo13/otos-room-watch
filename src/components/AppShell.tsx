import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Wind } from "lucide-react";
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

              <Link
                to="/estoque"
                activeProps={{
                  className: "flex items-center gap-2 rounded-md bg-brand px-3 py-2 text-sm font-medium text-panel",
                }}
                inactiveProps={{
                  className: "flex items-center gap-2 rounded-md px-3 py-2 text-sm text-ink hover:bg-panel",
                }}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-4 shrink-0"
                >
                  <path d="M3 7.5 12 3l9 4.5v9L12 21 3 16.5z" />
                  <path d="M3 7.5 12 12l9-4.5M12 12v9" />
                </svg>
                <span>Controle de Estoque</span>
              </Link>
              <Link
                to="/ar-condicionado"
                activeProps={{ className: "flex items-center gap-2 rounded-md bg-brand px-3 py-2 text-sm font-medium text-panel" }}
                inactiveProps={{ className: "flex items-center gap-2 rounded-md px-3 py-2 text-sm text-ink hover:bg-panel" }}
              >
                <Wind aria-hidden="true" className="size-4 shrink-0" />
                <span>Ar-Condicionado</span>
              </Link>
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

        <main className="min-w-0 lg:col-span-9">{children}</main>
      </div>
    </div>
  );
}

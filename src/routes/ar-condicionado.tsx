import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, ChevronLeft, ChevronRight, Download, Pencil, Plus, Search, Trash2, Wind, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { consultoriosQuery } from "@/lib/consultorios";
import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";

export const Route = createFileRoute("/ar-condicionado")({
  head: () => ({ meta: [
    { title: "Ar-Condicionado — Cronograma de limpeza | OTOS" },
    { name: "description", content: "Cronograma anual de limpeza dos aparelhos de ar-condicionado da OTOS, por sala e setor." },
    { property: "og:title", content: "Ar-Condicionado — Cronograma de limpeza | OTOS" },
    { property: "og:description", content: "Limpezas realizadas, programadas e pendentes nos ambientes da OTOS." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(consultoriosQuery),
  component: AirConditioning,
});

const BASE_YEAR = 2026;
const SECTORS = ["Térreo", "1º Andar", "2º Andar", "Eusébio", "Parquelândia"] as const;
const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const FULL_MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const STATUS_LABELS = { ok: "OK", attention: "Atenção", late: "Atrasado" };
const STATUS_TONES = { ok: "bg-ok/10 text-ok ring-ok/20", attention: "bg-attn/10 text-attn ring-attn/20", late: "bg-prob/10 text-prob ring-prob/20" };
const STATUS_DOTS = {
  ok: "bg-emerald-500 ring-4 ring-emerald-500/20",
  attention: "bg-amber-500 ring-4 ring-amber-500/25",
  late: "bg-red-600 ring-4 ring-red-600/25",
};
type Schedule = { realizados: Record<string, string>; programados: number[] };
type Room = Schedule & { id: string; setor: string; nome: string; posicao?: number; anos?: Record<string, Schedule> };
type Modal = { type: "room"; room?: Room } | { type: "delete"; room: Room } | { type: "month"; room: Room; month: number };
type AcRow = Database["public"]["Tables"]["ac_schedule"]["Row"];
function fromRow(r: AcRow): Room {
  const anos = (r.anos && typeof r.anos === "object" && !Array.isArray(r.anos) ? r.anos : {}) as Record<string, Schedule>;
  return { id: r.id, setor: r.setor, nome: r.nome, posicao: r.posicao, realizados: (r.realizados ?? {}) as Record<string, string>, programados: r.programados ?? [], ...(Object.keys(anos).length ? { anos } : {}) };
}
function toRow(r: Room, posicao: number) {
  return { id: r.id, setor: r.setor, nome: r.nome, posicao, realizados: r.realizados, programados: r.programados, anos: (r.anos ?? {}) as Json };
}
const field = "mt-2 w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/40";
const label = "block font-mono text-[10px] uppercase tracking-[0.15em] text-muted";

function schedule(room: Room, year: number): Schedule {
  return year === BASE_YEAR ? room : room.anos?.[year] ?? { realizados: {}, programados: [] };
}
function putSchedule(room: Room, year: number, value: Schedule): Room {
  return year === BASE_YEAR ? { ...room, ...value } : { ...room, anos: { ...room.anos, [year]: value } };
}
function validSchedule(value: unknown): value is Schedule {
  if (!value || typeof value !== "object") return false;
  const s = value as Schedule;
  return !!s.realizados && typeof s.realizados === "object" && !Array.isArray(s.realizados)
    && Object.entries(s.realizados).every(([k, v]) => /^([0-9]|1[01])$/.test(k) && typeof v === "string")
    && Array.isArray(s.programados) && s.programados.every(m => Number.isInteger(m) && m >= 0 && m < 12);
}
function validRooms(value: unknown): value is Room[] {
  return Array.isArray(value) && value.every(r => r && typeof r === "object" && typeof r.id === "string"
    && typeof r.nome === "string" && SECTORS.includes(r.setor)
    && (!r.anos || (typeof r.anos === "object" && Object.entries(r.anos).every(([y, s]) => /^\d{4}$/.test(y) && validSchedule(s)))) && validSchedule(r))
    && new Set(value.map(r => r.id)).size === value.length;
}
function normalize(text: string) { return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }
function pendingMonths(room: Room, year: number): number[] {
  const completed = [BASE_YEAR, ...Object.keys(room.anos ?? {}).map(Number)]
    .flatMap(y => Object.entries(schedule(room, y).realizados)
      .filter(([, value]) => value.trim())
      .map(([m]) => y * 12 + Number(m)));
  const lastDone = completed.length ? Math.max(...completed) : -1;
  return schedule(room, year).programados.filter(m => year * 12 + m > lastDone);
}
function roomStatus(room: Room, year: number, today: Date) {
  const current = today.getFullYear() * 12 + today.getMonth();
  const pending = pendingMonths(room, year);
  if (pending.some(m => year * 12 + m < current)) return "late";
  if (pending.some(m => year * 12 + m === current)) return "attention";
  return "ok";
}

function RoomStatusDot({ status }: { status: keyof typeof STATUS_LABELS }) {
  return <span role="img" aria-label={`Status: ${STATUS_LABELS[status]}`} title={STATUS_LABELS[status]} className={`inline-block size-2 shrink-0 rounded-full ${STATUS_DOTS[status]}`} />;
}

function AirConditioning() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [sector, setSector] = useState("Todos");
  const [search, setSearch] = useState("");
  const [year, setYear] = useState(BASE_YEAR);
  const [today, setToday] = useState(new Date(BASE_YEAR, 0, 1));
  const [view, setView] = useState<"schedule" | "report">("schedule");
  const [reportMonth, setReportMonth] = useState(0);
  const [modal, setModal] = useState<Modal | null>(null);
  const [name, setName] = useState("");
  const [roomSector, setRoomSector] = useState<string>(SECTORS[0]);
  const [text, setText] = useState("");
  const [autoSchedule, setAutoSchedule] = useState(true);
  useEffect(() => {
    const now = new Date();
    setToday(now); setYear(now.getFullYear()); setReportMonth(now.getMonth());
    let active = true;
    const load = async () => {
      const { data, error: err } = await supabase.from("ac_schedule").select("*").order("posicao").order("created_at");
      if (!active) return;
      if (err) { setError("Não foi possível carregar os dados do servidor. Verifique a conexão e recarregue a página."); return; }
      setRooms((data ?? []).map(fromRow)); setReady(true); setError("");
    };
    void load();
    const channel = supabase.channel("ac_schedule_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "ac_schedule" }, () => { void load(); })
      .subscribe();
    return () => { active = false; void supabase.removeChannel(channel); };
  }, []);
  async function persist(next: Room[]) {
    const nextIds = new Set(next.map(r => r.id));
    const removed = rooms.filter(r => !nextIds.has(r.id)).map(r => r.id);
    const changed = next.filter(r => { const old = rooms.find(o => o.id === r.id); return !old || JSON.stringify(old) !== JSON.stringify(r); });
    const maxPos = rooms.reduce((m, r) => Math.max(m, r.posicao ?? 0), 0);
    const prev = rooms;
    setRooms(next);
    const ops: PromiseLike<{ error: unknown }>[] = [];
    if (removed.length) ops.push(supabase.from("ac_schedule").delete().in("id", removed));
    if (changed.length) ops.push(supabase.from("ac_schedule").upsert(changed.map((r, i) => toRow(r, r.posicao ?? maxPos + 1 + i))));
    const results = await Promise.all(ops);
    if (results.some(r => r.error)) {
      setRooms(prev);
      setError("Não foi possível salvar no servidor. A alteração não foi aplicada; verifique a conexão.");
      return false;
    }
    setError(""); return true;
  }

  const visible = rooms.filter(r => (sector === "Todos" || r.setor === sector) && normalize(r.nome).includes(normalize(search.trim())));
  const counts = visible.reduce((acc, r) => { acc[roomStatus(r, year, today)]++; return acc; }, { ok: 0, attention: 0, late: 0 });
  const monthlyCompleted = visible.filter(room => schedule(room, year).realizados[reportMonth]?.trim());
  function openRoom(room?: Room) {
    setName(room?.nome ?? ""); setRoomSector(room?.setor ?? (sector === "Todos" ? SECTORS[0] : sector));
    setModal(room ? { type: "room", room } : { type: "room" });
  }
  function openMonth(room: Room, month: number) {
    const defaultDate = today.getFullYear() === year && today.getMonth() === month
      ? `${String(today.getDate()).padStart(2, "0")}/${String(month + 1).padStart(2, "0")}` : "";
    setText(schedule(room, year).realizados[month] ?? defaultDate); setAutoSchedule(true); setModal({ type: "month", room, month });
  }
  function updateMonth(action: "done" | "toggle" | "clear") {
    if (modal?.type !== "month") return;
    const { room, month } = modal;
    const old = schedule(room, year);
    const next: Schedule = { realizados: { ...old.realizados }, programados: [...old.programados] };
    if (action === "done") {
      if (!text.trim()) return;
      next.realizados[month] = text.trim();
      next.programados = next.programados.filter(m => m !== month);
    } else if (action === "clear") {
      delete next.realizados[month]; next.programados = next.programados.filter(m => m !== month);
    } else {
      if (next.programados.includes(month)) next.programados = next.programados.filter(m => m !== month);
      else { delete next.realizados[month]; next.programados.push(month); }
    }
    let updated = putSchedule(room, year, next);
    if (action === "done" && autoSchedule) {
      const futureMonth = (month + 4) % 12;
      const futureYear = year + Math.floor((month + 4) / 12);
      const future = schedule(updated, futureYear);
      if (!future.realizados[futureMonth]) {
        updated = putSchedule(updated, futureYear, { ...future, programados: [...new Set([...future.programados, futureMonth])].sort((a,b) => a-b) });
      }
    }
    void persist(rooms.map(r => r.id === room.id ? updated : r)).then(ok => ok && setModal(null));
  }
  function exportCSV() {
    const rows = [["Setor", "Ambiente", "Status Atual", "Limpezas Programadas", "Limpezas Realizadas"], ...visible.map(r => {
      const s = schedule(r, year);
      const planned = [...s.programados].sort((a, b) => a - b).map(m => FULL_MONTHS[m]).join(", ");
      const completed = Object.entries(s.realizados).sort(([a], [b]) => Number(a) - Number(b)).map(([, value]) => value.trim()).filter(Boolean).join(", ");
      return [r.setor, r.nome, STATUS_LABELS[roomStatus(r, year, today)], planned || "Nenhuma", completed || "Nenhuma"];
    })];
    const csv = "\uFEFFsep=;\n" + rows.map(row => row.map(v => `"${(/^[=+@-]/.test(v) ? "'" + v : v).replace(/"/g, '""')}"`).join(";")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a"); a.href = url; a.download = `otos-ar-condicionado-${year}.csv`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <AppShell>
    <div className="grid min-w-0 gap-4 sm:flex sm:flex-wrap sm:items-end sm:justify-between">
      <div className="min-w-0"><p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">Manutenção dos ambientes</p>
        <h1 className="mt-1 flex items-center gap-3 text-2xl font-semibold leading-tight sm:text-4xl"><Wind className="hidden size-7 shrink-0 text-brand sm:block" />Ar-Condicionado</h1></div>
      <div className="flex flex-wrap gap-2 [&>button]:min-h-11 sm:[&>button]:min-h-9">
        <Button variant="outline" onClick={exportCSV} disabled={!ready}><Download />Exportar Planilha (CSV)</Button>
        <Button onClick={() => openRoom()} disabled={!ready}><Plus />Nova Sala</Button>
      </div>
    </div>
    {error && <p role="alert" className="mt-4 rounded-md border border-prob/30 bg-prob/10 p-3 text-sm text-prob">{error}</p>}
    {!ready ? <p role="status" className="mt-8 text-sm text-muted">{error ? "Cronograma indisponível." : "Carregando cronograma…"}</p> : <>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { title: "Situação OK", value: counts.ok, tone: "text-ok", ring: "ring-ok/20", subtitle: "limpeza em dia" },
          { title: "Atenção", value: counts.attention, tone: "text-attn", ring: "ring-attn/20", subtitle: "limpezas neste mês" },
          { title: "Atrasados / Pendentes", value: counts.late, tone: "text-prob", ring: "ring-prob/20", subtitle: "ambientes com limpeza pendente" },
        ].map(c => <div key={c.title} className={`rounded-lg bg-panel p-4 ring-1 ${c.ring}`}>
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">{c.title}</p>
          <p className={`mt-2 font-mono text-3xl font-semibold ${c.tone}`}>{c.value}</p>
          <p className="mt-1 text-xs text-muted">{c.subtitle}</p>
        </div>)}
      </div>
      <div className="mt-5 flex gap-2 border-b border-line pb-3" role="tablist" aria-label="Visão de Ar-Condicionado">
        <Button role="tab" aria-selected={view === "schedule"} aria-controls="ac-schedule" id="ac-schedule-tab" className="min-h-11" variant={view === "schedule" ? "default" : "ghost"} onClick={() => setView("schedule")}>Cronograma</Button>
        <Button role="tab" aria-selected={view === "report"} aria-controls="ac-report" id="ac-report-tab" className="min-h-11" variant={view === "report" ? "default" : "ghost"} onClick={() => setView("report")}>Relatório Mensal</Button>
      </div>
      <div className="mt-6 flex gap-1 overflow-x-auto whitespace-nowrap border-b border-line pb-3 md:flex-wrap" role="tablist" aria-label="Filtrar por setor">
        {["Todos", ...SECTORS].map(s => <Button key={s} role="tab" aria-selected={sector === s} variant={sector === s ? "default" : "ghost"} size="sm" className="min-h-11 shrink-0 md:min-h-8" onClick={() => setSector(s)}>
          {s}<span className="font-mono text-[10px] opacity-70">{s === "Todos" ? rooms.length : rooms.filter(r => r.setor === s).length}</span>
        </Button>)}
      </div>
      <div className="my-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-line bg-panel px-3 py-2 sm:max-w-xs">
          <Search className="size-4 shrink-0 text-muted" /><input aria-label="Buscar sala ou ambiente" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar sala ou ambiente…" className="min-w-0 w-full bg-transparent text-sm outline-none placeholder:text-muted" />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="ghost" size="icon" title="Ano anterior" aria-label="Ano anterior" onClick={() => setYear(y => y - 1)} disabled={year <= BASE_YEAR}><ChevronLeft /></Button>
          <span className="min-w-12 text-center font-mono text-sm font-medium" aria-label="Ano do cronograma">{year}</span>
          <Button variant="ghost" size="icon" title="Próximo ano" aria-label="Próximo ano" onClick={() => setYear(y => y + 1)} disabled={year >= 2099}><ChevronRight /></Button>
        </div>
      </div>
      {view === "schedule" ? <div id="ac-schedule" role="tabpanel" aria-labelledby="ac-schedule-tab">
      <div className="relative hidden max-h-[70vh] max-w-full overflow-auto border-y border-line md:block">
        <table className="w-full min-w-[1450px] border-separate border-spacing-0 text-left text-sm">
          <thead><tr><th scope="col" className="sticky left-0 top-0 z-30 w-64 border-b border-line bg-panel px-3 py-3 font-mono text-[10px] uppercase text-muted shadow-sm">Sala / Ambiente</th>
            {MONTHS.map((m,i) => <th scope="col" key={m} className={`sticky top-0 z-20 w-24 border-b bg-panel px-2 py-3 text-center font-mono text-xs font-medium shadow-sm ${year === today.getFullYear() && i === today.getMonth() ? "border-b-2 border-attn text-attn" : "border-line text-muted"}`}>{m}</th>)}
          </tr></thead>
          <tbody>{visible.map(room => {
            const s = schedule(room, year);
            return <tr key={room.id}>
              <th scope="row" className="sticky left-0 z-10 border-b border-line bg-panel px-3 py-3 font-normal">
                <div className="flex items-center justify-between gap-2"><span className="flex min-w-0 items-center gap-2 font-medium"><RoomStatusDot status={roomStatus(room, year, today)} /><span className="min-w-0 break-words">{room.nome}</span></span>
                  <div className="flex shrink-0"><Button variant="ghost" size="icon" className="size-7 text-muted" title={`Editar ${room.nome}`} aria-label={`Editar ${room.nome}`} onClick={() => openRoom(room)}><Pencil className="size-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="size-7 text-muted hover:bg-prob/10 hover:text-prob" title={`Excluir ${room.nome}`} aria-label={`Excluir ${room.nome}`} onClick={() => setModal({ type: "delete", room })}><Trash2 className="size-3.5" /></Button></div>
                </div><span className="mt-1 inline-block rounded bg-brand/10 px-1.5 py-0.5 font-mono text-[9px] text-brand">{room.setor}</span>
              </th>
              {MONTHS.map((month,i) => <td key={month} className="border-b border-line p-1.5">
                <Button variant="ghost" title={`${room.nome} — ${month}/${year}`} aria-label={`${room.nome}, ${month} ${year}: ${s.realizados[i] ? `realizado ${s.realizados[i]}` : s.programados.includes(i) ? "programado" : "sem marcação"}`} onClick={() => openMonth(room,i)}
                  className={`h-12 w-full whitespace-normal rounded border px-1 text-[10px] leading-tight ${s.realizados[i] ? "border-ok/20 bg-ok/10 text-ok hover:bg-ok/20" : s.programados.includes(i) ? "border-prob/30 bg-prob/10 text-prob hover:bg-prob/20" : "border-transparent text-muted hover:border-line hover:bg-panel"}`}>
                  {s.realizados[i] ? <span className="flex items-center justify-center gap-1"><Check className="size-3 shrink-0" /><span className="break-words">{s.realizados[i]}</span></span> : s.programados.includes(i) ? "Programado" : "—"}
                </Button>
              </td>)}
            </tr>;
          })}</tbody>
        </table>
      </div>
      <div className="block space-y-3 md:hidden">
        {visible.map(room => {
          const status = roomStatus(room, year, today);
          const nextMonth = pendingMonths(room, year).sort((a, b) => a - b)[0];
          return <article key={room.id} className="min-w-0 rounded-lg border border-line bg-panel p-4">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
              <h2 className="flex min-w-0 items-center gap-2 text-lg font-semibold"><RoomStatusDot status={status} /><span className="min-w-0 break-words">{room.nome}</span></h2>
              <div className="flex shrink-0">
                <Button variant="ghost" size="icon" className="size-11 text-muted" title={`Editar ${room.nome}`} aria-label={`Editar ${room.nome}`} onClick={() => openRoom(room)}><Pencil /></Button>
                <Button variant="ghost" size="icon" className="size-11 text-muted hover:bg-prob/10 hover:text-prob" title={`Excluir ${room.nome}`} aria-label={`Excluir ${room.nome}`} onClick={() => setModal({ type: "delete", room })}><Trash2 /></Button>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className="rounded bg-brand/10 px-2 py-1 text-brand">{room.setor}</span>
              <span className={`rounded px-2 py-1 font-medium ring-1 ${STATUS_TONES[status]}`}>{STATUS_LABELS[status]}</span>
            </div>
            <p className="mt-4 text-sm text-muted">Próxima Limpeza: <span className="font-medium text-ink">{nextMonth === undefined ? "Não programada" : `${FULL_MONTHS[nextMonth]} / ${year}`}</span></p>
            <Button className="mt-4 h-auto min-h-12 w-full whitespace-normal py-3" onClick={() => openMonth(room, nextMonth ?? (year === today.getFullYear() ? today.getMonth() : 0))}><Check />Dar Baixa / Gerenciar</Button>
          </article>;
        })}
      </div>
      {visible.length === 0 && <p className="py-8 text-center text-sm text-muted">Nenhum ambiente encontrado.</p>}
      <div className="mt-3 flex flex-wrap justify-between gap-2 font-mono text-[10px] text-muted"><span>{visible.length} ambientes · {year}</span><span className="flex gap-4"><span className="text-ok">✓ Realizado</span><span className="text-prob">Programado</span></span></div>
      </div> : <section id="ac-report" role="tabpanel" aria-labelledby="ac-report-tab" className="border-t border-line pt-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <label className={`${label} w-full sm:w-60`}>Mês do relatório
            <select aria-label="Mês do relatório" className={`${field} min-h-12`} value={reportMonth} onChange={e => setReportMonth(Number(e.target.value))}>{FULL_MONTHS.map((month, i) => <option key={month} value={i}>{month}</option>)}</select>
          </label>
          <p className="text-sm text-ink">Total de limpezas realizadas em {FULL_MONTHS[reportMonth]}: <strong className="font-mono text-lg text-ok">{monthlyCompleted.length}</strong><span className="ml-2 text-muted">· {year}</span></p>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {monthlyCompleted.map(room => <article key={room.id} className="min-w-0 rounded-lg border border-line bg-panel p-4">
            <h2 className="break-words font-semibold">{room.nome} <span className="font-normal text-muted">({room.setor})</span></h2>
            <p className="mt-2 flex items-start gap-2 text-sm text-ok"><Check className="mt-0.5 size-4 shrink-0" /><span className="min-w-0 break-words">Limpeza realizada: {schedule(room, year).realizados[reportMonth]}</span></p>
          </article>)}
        </div>
        {monthlyCompleted.length === 0 && <p className="py-8 text-center text-sm text-muted">Nenhuma limpeza realizada em {FULL_MONTHS[reportMonth]} de {year} para os filtros selecionados.</p>}
      </section>}
    </>}
    <Dialog.Root open={modal !== null} onOpenChange={open => { if (!open) setModal(null); }}>
      <Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-40 bg-ink/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-line bg-panel p-6 text-ink" aria-describedby="ac-modal-description">
          <Dialog.Title className="pr-8 text-lg font-semibold">{modal?.type === "room" ? modal.room ? "Editar sala" : "Nova sala" : modal?.type === "delete" ? "Excluir ambiente?" : "Limpeza do ar-condicionado"}</Dialog.Title>
          <Dialog.Description id="ac-modal-description" className="mt-1 text-sm text-muted">{modal?.type === "month" ? `${modal.room.nome} · ${MONTHS[modal.month]} / ${year}` : modal?.type === "delete" ? modal.room.nome : "Sala / Ambiente"}</Dialog.Description>
          <Dialog.Close asChild><Button variant="ghost" size="icon" className="absolute right-3 top-3 size-11" title="Fechar" aria-label="Fechar"><X /></Button></Dialog.Close>
          {error && <p role="alert" className="mt-3 text-sm text-prob">{error}</p>}
          {modal?.type === "room" && <form className="mt-5 space-y-4" onSubmit={e => {
            e.preventDefault(); if (!name.trim()) return;
            const next = modal.room ? rooms.map(r => r.id === modal.room?.id ? { ...r, nome: name.trim(), setor: roomSector } : r)
              : [...rooms, { id: crypto.randomUUID(), nome: name.trim(), setor: roomSector, realizados: {}, programados: [] }];
            void persist(next).then(ok => ok && setModal(null));
          }}>
            <label className={label}>Nome da sala / ambiente<input className={field} value={name} onChange={e => setName(e.target.value)} required maxLength={100} autoFocus /></label>
            <label className={label}>Setor<select className={field} value={roomSector} onChange={e => setRoomSector(e.target.value)}>{SECTORS.map(s => <option key={s}>{s}</option>)}</select></label>
            <div className="grid gap-2 sm:flex sm:justify-end [&>button]:h-auto [&>button]:min-h-12 [&>button]:py-3"><Button type="button" variant="outline" onClick={() => setModal(null)}>Cancelar</Button><Button type="submit" disabled={!name.trim()}>Salvar sala</Button></div>
          </form>}
          {modal?.type === "delete" && <div className="mt-5"><p className="text-sm">Excluir este ambiente e todas as suas marcações de limpeza?</p><div className="mt-5 grid gap-2 sm:flex sm:justify-end [&>button]:h-auto [&>button]:min-h-12 [&>button]:py-3"><Button variant="outline" onClick={() => setModal(null)}>Cancelar</Button><Button variant="destructive" onClick={() => { void persist(rooms.filter(r => r.id !== modal.room.id)).then(ok => ok && setModal(null)); }}>Excluir ambiente</Button></div></div>}
          {modal?.type === "month" && <div className="mt-5">
            <label className={`${label} mb-4`}>Mês da limpeza<select className={field} value={modal.month} onChange={e => openMonth(modal.room, Number(e.target.value))}>{FULL_MONTHS.map((month, i) => <option key={month} value={i}>{month}</option>)}</select></label>
            <form onSubmit={e => { e.preventDefault(); updateMonth("done"); }}>
              <label className={label}>Data realizada ou observação<input className={field} value={text} onChange={e => setText(e.target.value)} placeholder="07/10 ou observação curta" required maxLength={60} autoFocus /></label>
              <label className="mt-4 flex min-h-11 items-start gap-3 py-2 text-sm"><input type="checkbox" className="size-5 shrink-0 accent-brand" checked={autoSchedule} onChange={e => setAutoSchedule(e.target.checked)} />Agendar próxima limpeza automaticamente daqui a 4 meses</label>
              <Button type="submit" className="mt-4 h-auto min-h-12 w-full whitespace-normal py-3" disabled={!text.trim()}><Check />Dar baixa · Salvar limpeza</Button>
            </form>
            <div className="mt-5 grid gap-2 border-t border-line pt-4 [&>button]:h-auto [&>button]:min-h-12 [&>button]:w-full [&>button]:whitespace-normal [&>button]:py-3"><Button variant="outline" className="text-prob" onClick={() => updateMonth("toggle")}>{schedule(modal.room, year).programados.includes(modal.month) ? "Desmarcar programado" : "Marcar programado"}</Button><Button variant="ghost" className="text-muted" onClick={() => updateMonth("clear")}><Trash2 />Limpar mês</Button></div>
          </div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  </AppShell>;
}

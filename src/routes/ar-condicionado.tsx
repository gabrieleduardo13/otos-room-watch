import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, ChevronLeft, ChevronRight, Download, Pencil, Plus, Search, Trash2, Wind, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { consultoriosQuery } from "@/lib/consultorios";

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

const STORAGE_KEY = "otos_ac_schedule_v1";
const BASE_YEAR = 2026;
const SECTORS = ["Térreo", "1º Andar", "2º Andar", "Eusébio", "Parquelândia"] as const;
const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
type Schedule = { realizados: Record<string, string>; programados: number[] };
type Room = Schedule & { id: string; setor: string; nome: string; anos?: Record<string, Schedule> };
type Modal = { type: "room"; room?: Room } | { type: "delete"; room: Room } | { type: "month"; room: Room; month: number };
const INITIAL_ROOMS: Room[] = [
  {
    "id": "ac-1",
    "setor": "Térreo",
    "nome": "sala 1",
    "realizados": {
      "4": "16/05"
    },
    "programados": [
      10
    ]
  },
  {
    "id": "ac-2",
    "setor": "Térreo",
    "nome": "sala 2",
    "realizados": {
      "0": "24/01"
    },
    "programados": [
      5,
      10
    ]
  },
  {
    "id": "ac-3",
    "setor": "Térreo",
    "nome": "sala 3",
    "realizados": {
      "4": "16/05"
    },
    "programados": [
      10
    ]
  },
  {
    "id": "ac-4",
    "setor": "Térreo",
    "nome": "sala 4",
    "realizados": {
      "2": "02/03"
    },
    "programados": [
      7
    ]
  },
  {
    "id": "ac-5",
    "setor": "Térreo",
    "nome": "sala 5",
    "realizados": {},
    "programados": [
      7
    ]
  },
  {
    "id": "ac-6",
    "setor": "Térreo",
    "nome": "sala 6",
    "realizados": {
      "0": "28/01"
    },
    "programados": [
      5,
      7
    ]
  },
  {
    "id": "ac-7",
    "setor": "Térreo",
    "nome": "sala 7",
    "realizados": {
      "0": "20/01"
    },
    "programados": [
      5,
      10
    ]
  },
  {
    "id": "ac-8",
    "setor": "Térreo",
    "nome": "sala 8",
    "realizados": {
      "5": "06/06"
    },
    "programados": [
      10
    ]
  },
  {
    "id": "ac-9",
    "setor": "Térreo",
    "nome": "sala 9",
    "realizados": {
      "5": "06/06"
    },
    "programados": [
      10
    ]
  },
  {
    "id": "ac-10",
    "setor": "Térreo",
    "nome": "sala 10 Danielle",
    "realizados": {},
    "programados": [
      0,
      5,
      10
    ]
  },
  {
    "id": "ac-11",
    "setor": "Térreo",
    "nome": "sala 11",
    "realizados": {},
    "programados": [
      2,
      7
    ]
  },
  {
    "id": "ac-12",
    "setor": "Térreo",
    "nome": "sala 12",
    "realizados": {},
    "programados": [
      2,
      7
    ]
  },
  {
    "id": "ac-13",
    "setor": "Térreo",
    "nome": "Prime Recep e consul",
    "realizados": {
      "5": "16/06 cons",
      "6": "25/07 recep"
    },
    "programados": [
      10
    ]
  },
  {
    "id": "ac-14",
    "setor": "Térreo",
    "nome": "Sala audio A",
    "realizados": {},
    "programados": [
      2,
      7
    ]
  },
  {
    "id": "ac-15",
    "setor": "Térreo",
    "nome": "sala audio B",
    "realizados": {
      "3": "04/04"
    },
    "programados": [
      8,
      10
    ]
  },
  {
    "id": "ac-16",
    "setor": "Térreo",
    "nome": "lanchonete",
    "realizados": {},
    "programados": []
  },
  {
    "id": "ac-17",
    "setor": "Térreo",
    "nome": "pqa",
    "realizados": {
      "0": "24/01"
    },
    "programados": [
      5,
      10
    ]
  },
  {
    "id": "ac-18",
    "setor": "Térreo",
    "nome": "recep 22000",
    "realizados": {},
    "programados": []
  },
  {
    "id": "ac-19",
    "setor": "Térreo",
    "nome": "recep 60000",
    "realizados": {
      "0": "10/01",
      "6": "25/07"
    },
    "programados": [
      5,
      10
    ]
  },
  {
    "id": "ac-20",
    "setor": "Térreo",
    "nome": "tst de próteses",
    "realizados": {
      "0": "10/01",
      "6": "25/07"
    },
    "programados": [
      10
    ]
  },
  {
    "id": "ac-21",
    "setor": "Térreo",
    "nome": "PA Recep ORL",
    "realizados": {},
    "programados": [
      2,
      7
    ]
  },
  {
    "id": "ac-22",
    "setor": "Térreo",
    "nome": "proc auditivo",
    "realizados": {
      "0": "10/01"
    },
    "programados": [
      5,
      10
    ]
  },
  {
    "id": "ac-23",
    "setor": "Térreo",
    "nome": "refeitório",
    "realizados": {
      "4": "16/05"
    },
    "programados": [
      10
    ]
  },
  {
    "id": "ac-24",
    "setor": "1º Andar",
    "nome": "sala 14",
    "realizados": {
      "0": "10/01"
    },
    "programados": [
      5,
      10
    ]
  },
  {
    "id": "ac-25",
    "setor": "1º Andar",
    "nome": "sala 15",
    "realizados": {
      "3": "25/04",
      "8": "01/09"
    },
    "programados": []
  },
  {
    "id": "ac-26",
    "setor": "1º Andar",
    "nome": "sala 16",
    "realizados": {
      "4": "02/05"
    },
    "programados": [
      10
    ]
  },
  {
    "id": "ac-27",
    "setor": "1º Andar",
    "nome": "sala 17",
    "realizados": {
      "4": "02/05",
      "7": "10/08"
    },
    "programados": [
      11
    ]
  },
  {
    "id": "ac-28",
    "setor": "1º Andar",
    "nome": "sala 18",
    "realizados": {
      "4": "02/05",
      "8": "17/09"
    },
    "programados": []
  },
  {
    "id": "ac-29",
    "setor": "1º Andar",
    "nome": "sala 19",
    "realizados": {
      "0": "26/01",
      "5": "06/06",
      "7": "22/08"
    },
    "programados": [
      11
    ]
  },
  {
    "id": "ac-30",
    "setor": "1º Andar",
    "nome": "sala 20",
    "realizados": {
      "0": "10/01"
    },
    "programados": [
      5,
      10
    ]
  },
  {
    "id": "ac-31",
    "setor": "1º Andar",
    "nome": "sala 21",
    "realizados": {
      "4": "05/05",
      "8": "25/09"
    },
    "programados": []
  },
  {
    "id": "ac-32",
    "setor": "1º Andar",
    "nome": "sala 22",
    "realizados": {
      "0": "22/01",
      "1": "12/02",
      "6": "25/07"
    },
    "programados": [
      10
    ]
  },
  {
    "id": "ac-33",
    "setor": "1º Andar",
    "nome": "sala 23",
    "realizados": {
      "4": "16/05"
    },
    "programados": [
      10
    ]
  },
  {
    "id": "ac-34",
    "setor": "1º Andar",
    "nome": "sala 24",
    "realizados": {
      "1": "23/02"
    },
    "programados": [
      6,
      10
    ]
  },
  {
    "id": "ac-35",
    "setor": "1º Andar",
    "nome": "sala 25",
    "realizados": {
      "0": "26/01"
    },
    "programados": [
      5,
      10
    ]
  },
  {
    "id": "ac-36",
    "setor": "1º Andar",
    "nome": "CDO",
    "realizados": {
      "4": "22/05"
    },
    "programados": [
      9
    ]
  },
  {
    "id": "ac-37",
    "setor": "1º Andar",
    "nome": "REPOUSO",
    "realizados": {
      "0": "10/01",
      "8": "27/08"
    },
    "programados": [
      10
    ]
  },
  {
    "id": "ac-38",
    "setor": "1º Andar",
    "nome": "recep 1º and 60000",
    "realizados": {
      "3": "20/05",
      "8": "19/09"
    },
    "programados": []
  },
  {
    "id": "ac-39",
    "setor": "1º Andar",
    "nome": "briquedoteca",
    "realizados": {},
    "programados": [
      5,
      10
    ]
  },
  {
    "id": "ac-40",
    "setor": "1º Andar",
    "nome": "recep exames frente LD's",
    "realizados": {
      "4": "22/05"
    },
    "programados": [
      10
    ]
  },
  {
    "id": "ac-41",
    "setor": "1º Andar",
    "nome": "pqa 1 AND",
    "realizados": {
      "4": "22/05"
    },
    "programados": [
      9
    ]
  },
  {
    "id": "ac-42",
    "setor": "1º Andar",
    "nome": "espera exames",
    "realizados": {},
    "programados": [
      0,
      6,
      11
    ]
  },
  {
    "id": "ac-43",
    "setor": "1º Andar",
    "nome": "Cyber",
    "realizados": {
      "6": "25/07"
    },
    "programados": [
      9,
      10
    ]
  },
  {
    "id": "ac-44",
    "setor": "1º Andar",
    "nome": "recepção 24000",
    "realizados": {},
    "programados": [
      0,
      5,
      10
    ]
  },
  {
    "id": "ac-45",
    "setor": "2º Andar",
    "nome": "faturamento",
    "realizados": {
      "2": "07/03",
      "8": "26/09"
    },
    "programados": []
  },
  {
    "id": "ac-46",
    "setor": "2º Andar",
    "nome": "cpd",
    "realizados": {
      "2": "01/03",
      "4": "22/05"
    },
    "programados": [
      8
    ]
  },
  {
    "id": "ac-47",
    "setor": "2º Andar",
    "nome": "auditório 1",
    "realizados": {
      "2": "07/03"
    },
    "programados": [
      6
    ]
  },
  {
    "id": "ac-48",
    "setor": "2º Andar",
    "nome": "auditório 2",
    "realizados": {
      "2": "07/03"
    },
    "programados": [
      6
    ]
  },
  {
    "id": "ac-49",
    "setor": "2º Andar",
    "nome": "cal center",
    "realizados": {
      "2": "07/03",
      "4": "27/05",
      "8": "25/09"
    },
    "programados": []
  },
  {
    "id": "ac-50",
    "setor": "2º Andar",
    "nome": "adm",
    "realizados": {
      "2": "07/03"
    },
    "programados": [
      6
    ]
  },
  {
    "id": "ac-51",
    "setor": "2º Andar",
    "nome": "fin",
    "realizados": {
      "2": "01/02"
    },
    "programados": [
      6
    ]
  },
  {
    "id": "ac-52",
    "setor": "2º Andar",
    "nome": "corredor",
    "realizados": {},
    "programados": []
  },
  {
    "id": "ac-53",
    "setor": "2º Andar",
    "nome": "rh/cont/comp",
    "realizados": {
      "2": "07/03"
    },
    "programados": [
      6
    ]
  },
  {
    "id": "ac-54",
    "setor": "Eusébio",
    "nome": "audiologia",
    "realizados": {
      "3": "24/04",
      "8": "17/09"
    },
    "programados": [
      11
    ]
  },
  {
    "id": "ac-55",
    "setor": "Eusébio",
    "nome": "LD",
    "realizados": {
      "3": "24/04",
      "8": "17/09"
    },
    "programados": [
      11
    ]
  },
  {
    "id": "ac-56",
    "setor": "Eusébio",
    "nome": "sala 02",
    "realizados": {
      "3": "24/04",
      "8": "17/09"
    },
    "programados": [
      11
    ]
  },
  {
    "id": "ac-57",
    "setor": "Eusébio",
    "nome": "sala 03",
    "realizados": {
      "3": "24/04",
      "8": "17/09"
    },
    "programados": [
      11
    ]
  },
  {
    "id": "ac-58",
    "setor": "Eusébio",
    "nome": "sala 04",
    "realizados": {
      "3": "24/04",
      "8": "17/09"
    },
    "programados": [
      11
    ]
  },
  {
    "id": "ac-59",
    "setor": "Eusébio",
    "nome": "recepção",
    "realizados": {
      "0": "15/01",
      "3": "24/04",
      "8": "17/09"
    },
    "programados": [
      11
    ]
  },
  {
    "id": "ac-60",
    "setor": "Eusébio",
    "nome": "Sala 01",
    "realizados": {
      "3": "24/04",
      "8": "17/09"
    },
    "programados": [
      11
    ]
  },
  {
    "id": "ac-61",
    "setor": "Parquelândia",
    "nome": "recepção",
    "realizados": {
      "1": "19/02"
    },
    "programados": [
      6,
      10
    ]
  },
  {
    "id": "ac-62",
    "setor": "Parquelândia",
    "nome": "PA SL 01",
    "realizados": {
      "2": "02/03"
    },
    "programados": [
      7
    ]
  },
  {
    "id": "ac-63",
    "setor": "Parquelândia",
    "nome": "LD SL 03",
    "realizados": {},
    "programados": [
      3,
      8
    ]
  },
  {
    "id": "ac-64",
    "setor": "Parquelândia",
    "nome": "sala 02",
    "realizados": {
      "5": "27/06"
    },
    "programados": [
      3,
      9
    ]
  },
  {
    "id": "ac-65",
    "setor": "Parquelândia",
    "nome": "sala 05",
    "realizados": {
      "5": "01/06"
    },
    "programados": [
      3,
      8
    ]
  },
  {
    "id": "ac-66",
    "setor": "Parquelândia",
    "nome": "vecto SL 04",
    "realizados": {
      "1": "12/02"
    },
    "programados": [
      10
    ]
  },
  {
    "id": "ac-67",
    "setor": "Parquelândia",
    "nome": "audio sl 06",
    "realizados": {},
    "programados": [
      1,
      6,
      11
    ]
  }
];
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
function roomStatus(room: Room, year: number, today: Date) {
  const current = today.getFullYear() * 12 + today.getMonth();
  const selected = schedule(room, year);
  const pending = selected.programados.filter(m => !selected.realizados[m]);
  if (pending.some(m => year * 12 + m < current)) return "late";
  if (pending.some(m => year * 12 + m === current)) return "attention";
  return "ok";
}

function AirConditioning() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [sector, setSector] = useState("Todos");
  const [search, setSearch] = useState("");
  const [year, setYear] = useState(BASE_YEAR);
  const [today, setToday] = useState(new Date(BASE_YEAR, 0, 1));
  const [modal, setModal] = useState<Modal | null>(null);
  const [name, setName] = useState("");
  const [roomSector, setRoomSector] = useState<string>(SECTORS[0]);
  const [text, setText] = useState("");
  const [autoSchedule, setAutoSchedule] = useState(true);
  useEffect(() => {
    const now = new Date();
    setToday(now); setYear(now.getFullYear());
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        const parsed: unknown = JSON.parse(saved);
        if (!validRooms(parsed)) throw new Error("invalid");
        setRooms(parsed);
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_ROOMS));
        setRooms(INITIAL_ROOMS);
      }
      setReady(true);
    } catch {
      setError("Não foi possível ler os dados salvos neste navegador. Eles não foram substituídos. Verifique se o armazenamento do navegador está disponível e recarregue a página.");
    }
  }, []);
  function persist(next: Room[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setRooms(next); setError(""); return true;
    } catch {
      setError("Não foi possível salvar. A alteração não foi aplicada; verifique o espaço e as permissões deste navegador.");
      return false;
    }
  }
  const visible = rooms.filter(r => (sector === "Todos" || r.setor === sector) && normalize(r.nome).includes(normalize(search.trim())));
  const counts = visible.reduce((acc, r) => { acc[roomStatus(r, year, today)]++; return acc; }, { ok: 0, attention: 0, late: 0 });
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
    if (persist(rooms.map(r => r.id === room.id ? updated : r))) setModal(null);
  }
  function exportCSV() {
    const rows = [["Sala / Ambiente", "Setor", "Ano", ...MONTHS], ...visible.map(r => {
      const s = schedule(r, year);
      return [r.nome, r.setor, String(year), ...MONTHS.map((_, m) => s.realizados[m] ? `Realizado: ${s.realizados[m]}` : s.programados.includes(m) ? "Programado" : "")];
    })];
    const csv = "\uFEFF" + rows.map(row => row.map(v => `"${(/^[=+@-]/.test(v) ? "'" + v : v).replace(/"/g, '""')}"`).join(";")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a"); a.href = url; a.download = `otos-ar-condicionado-${year}.csv`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <AppShell>
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">Manutenção dos ambientes</p>
        <h1 className="mt-1 flex items-center gap-3 text-3xl font-semibold leading-tight sm:text-4xl"><Wind className="hidden size-7 text-brand sm:block" />Ar-Condicionado</h1></div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={exportCSV} disabled={!ready}><Download />Exportar Planilha (CSV)</Button>
        <Button onClick={() => openRoom()} disabled={!ready}><Plus />Nova Sala</Button>
      </div>
    </div>
    {error && <p role="alert" className="mt-4 rounded-md border border-prob/30 bg-prob/10 p-3 text-sm text-prob">{error}</p>}
    {!ready ? <p role="status" className="mt-8 text-sm text-muted">{error ? "Cronograma indisponível." : "Carregando cronograma…"}</p> : <>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { title: "Situação OK", value: counts.ok, tone: "text-ok", ring: "ring-ok/20", subtitle: "limpeza em dia" },
          { title: "Atenção / Este mês", value: counts.attention, tone: "text-attn", ring: "ring-attn/20", subtitle: "limpezas programadas neste mês" },
          { title: "Atrasados / Pendentes", value: counts.late, tone: "text-prob", ring: "ring-prob/20", subtitle: "ambientes com limpeza pendente" },
        ].map(c => <div key={c.title} className={`rounded-lg bg-panel p-4 ring-1 ${c.ring}`}>
          <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">{c.title}</p>
          <p className={`mt-2 font-mono text-3xl font-semibold ${c.tone}`}>{c.value}</p>
          <p className="mt-1 text-xs text-muted">{c.subtitle}</p>
        </div>)}
      </div>
      <div className="mt-6 flex flex-wrap gap-1 border-b border-line pb-3" role="tablist" aria-label="Filtrar por setor">
        {["Todos", ...SECTORS].map(s => <Button key={s} role="tab" aria-selected={sector === s} variant={sector === s ? "default" : "ghost"} size="sm" onClick={() => setSector(s)}>
          {s}<span className="font-mono text-[10px] opacity-70">{s === "Todos" ? rooms.length : rooms.filter(r => r.setor === s).length}</span>
        </Button>)}
      </div>
      <div className="my-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-line bg-panel px-3 py-2 sm:max-w-xs">
          <Search className="size-4 shrink-0 text-muted" /><input aria-label="Buscar sala ou ambiente" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar sala ou ambiente…" className="min-w-0 w-full bg-transparent text-sm outline-none placeholder:text-muted" />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="ghost" size="icon" title="Ano anterior" aria-label="Ano anterior" onClick={() => setYear(y => y - 1)} disabled={year <= BASE_YEAR}><ChevronLeft /></Button>
          <span className="min-w-12 text-center font-mono text-sm font-medium" aria-label="Ano do cronograma">{year}</span>
          <Button variant="ghost" size="icon" title="Próximo ano" aria-label="Próximo ano" onClick={() => setYear(y => y + 1)} disabled={year >= 2099}><ChevronRight /></Button>
        </div>
      </div>
      <div className="max-w-full overflow-x-auto border-y border-line">
        <table className="w-full min-w-[1450px] border-separate border-spacing-0 text-left text-sm">
          <thead><tr><th scope="col" className="sticky left-0 z-20 w-64 border-b border-line bg-panel px-3 py-3 font-mono text-[10px] uppercase text-muted">Sala / Ambiente</th>
            {MONTHS.map((m,i) => <th scope="col" key={m} className={`w-24 border-b border-line px-2 py-3 text-center font-mono text-xs font-medium ${year === today.getFullYear() && i === today.getMonth() ? "bg-attn/10 text-attn" : "bg-panel text-muted"}`}>{m}</th>)}
          </tr></thead>
          <tbody>{visible.map(room => {
            const s = schedule(room, year);
            return <tr key={room.id}>
              <th scope="row" className="sticky left-0 z-10 border-b border-line bg-panel px-3 py-3 font-normal">
                <div className="flex items-center justify-between gap-2"><span className="min-w-0 break-words font-medium">{room.nome}</span>
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
      {visible.length === 0 && <p className="py-8 text-center text-sm text-muted">Nenhum ambiente encontrado.</p>}
      <div className="mt-3 flex flex-wrap justify-between gap-2 font-mono text-[10px] text-muted"><span>{visible.length} ambientes · {year}</span><span className="flex gap-4"><span className="text-ok">✓ Realizado</span><span className="text-prob">Programado</span></span></div>
    </>}
    <Dialog.Root open={modal !== null} onOpenChange={open => { if (!open) setModal(null); }}>
      <Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-40 bg-ink/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-line bg-panel p-6 text-ink" aria-describedby="ac-modal-description">
          <Dialog.Title className="pr-8 text-lg font-semibold">{modal?.type === "room" ? modal.room ? "Editar sala" : "Nova sala" : modal?.type === "delete" ? "Excluir ambiente?" : "Limpeza do ar-condicionado"}</Dialog.Title>
          <Dialog.Description id="ac-modal-description" className="mt-1 text-sm text-muted">{modal?.type === "month" ? `${modal.room.nome} · ${MONTHS[modal.month]} / ${year}` : modal?.type === "delete" ? modal.room.nome : "Sala / Ambiente"}</Dialog.Description>
          <Dialog.Close asChild><Button variant="ghost" size="icon" className="absolute right-3 top-3" title="Fechar" aria-label="Fechar"><X /></Button></Dialog.Close>
          {error && <p role="alert" className="mt-3 text-sm text-prob">{error}</p>}
          {modal?.type === "room" && <form className="mt-5 space-y-4" onSubmit={e => {
            e.preventDefault(); if (!name.trim()) return;
            const next = modal.room ? rooms.map(r => r.id === modal.room?.id ? { ...r, nome: name.trim(), setor: roomSector } : r)
              : [...rooms, { id: crypto.randomUUID(), nome: name.trim(), setor: roomSector, realizados: {}, programados: [] }];
            if (persist(next)) setModal(null);
          }}>
            <label className={label}>Nome da sala / ambiente<input className={field} value={name} onChange={e => setName(e.target.value)} required maxLength={100} autoFocus /></label>
            <label className={label}>Setor<select className={field} value={roomSector} onChange={e => setRoomSector(e.target.value)}>{SECTORS.map(s => <option key={s}>{s}</option>)}</select></label>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setModal(null)}>Cancelar</Button><Button type="submit" disabled={!name.trim()}>Salvar sala</Button></div>
          </form>}
          {modal?.type === "delete" && <div className="mt-5"><p className="text-sm">Excluir este ambiente e todas as suas marcações de limpeza?</p><div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={() => setModal(null)}>Cancelar</Button><Button variant="destructive" onClick={() => { if (persist(rooms.filter(r => r.id !== modal.room.id))) setModal(null); }}>Excluir ambiente</Button></div></div>}
          {modal?.type === "month" && <div className="mt-5">
            <form onSubmit={e => { e.preventDefault(); updateMonth("done"); }}>
              <label className={label}>Data realizada ou observação<input className={field} value={text} onChange={e => setText(e.target.value)} placeholder="07/10 ou observação curta" required maxLength={60} autoFocus /></label>
              <label className="mt-4 flex items-start gap-2 text-sm"><input type="checkbox" className="mt-0.5 size-4 accent-brand" checked={autoSchedule} onChange={e => setAutoSchedule(e.target.checked)} />Agendar próxima limpeza automaticamente daqui a 4 meses</label>
              <Button type="submit" className="mt-4 w-full" disabled={!text.trim()}><Check />Dar baixa · Salvar limpeza</Button>
            </form>
            <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4"><Button variant="outline" className="flex-1 text-prob" onClick={() => updateMonth("toggle")}>{schedule(modal.room, year).programados.includes(modal.month) ? "Desmarcar programado" : "Marcar programado"}</Button><Button variant="ghost" className="text-muted" onClick={() => updateMonth("clear")}><Trash2 />Limpar mês</Button></div>
          </div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  </AppShell>;
}

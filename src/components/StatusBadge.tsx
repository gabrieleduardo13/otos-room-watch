import type { Status } from "@/lib/consultorios";

const tone: Record<Status, string> = {
  OK: "bg-ok/10 text-ok ring-ok/20",
  "Atenção": "bg-attn/10 text-attn ring-attn/20",
  Problema: "bg-prob/10 text-prob ring-prob/20",
};

export function StatusBadge({ status, size = "sm" }: { status: Status; size?: "sm" | "lg" }) {
  if (size === "lg") {
    return (
      <span
        className={`rounded-full px-3 py-1 font-mono text-xs font-medium uppercase tracking-[0.12em] ring-1 ${tone[status]}`}
      >
        Estado: {status}
      </span>
    );
  }
  return (
    <span
      className={`rounded px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ring-1 ${tone[status]}`}
    >
      {status}
    </span>
  );
}

export function StatusDot({ status }: { status: Status }) {
  const bg = status === "OK" ? "bg-ok" : status === "Atenção" ? "bg-attn" : "bg-prob";
  return <span className={`size-2 shrink-0 rounded-full ${bg}`} />;
}

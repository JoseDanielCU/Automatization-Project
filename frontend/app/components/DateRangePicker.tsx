"use client";
import { useState } from "react";
import { CalendarDays, ChevronDown, X } from "lucide-react";

interface Props {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}
function firstOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

const PRESETS = [
  { label: "Mes actual",       start: () => firstOfMonth(),                               end: () => today() },
  { label: "Últimos 30 días",  start: () => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10); }, end: () => today() },
  { label: "Últimos 60 días",  start: () => { const d = new Date(); d.setDate(d.getDate() - 60); return d.toISOString().slice(0, 10); }, end: () => today() },
  { label: "Últimos 90 días",  start: () => { const d = new Date(); d.setDate(d.getDate() - 90); return d.toISOString().slice(0, 10); }, end: () => today() },
  { label: "Este año",         start: () => `${new Date().getFullYear()}-01-01`,           end: () => today() },
];

export function DateRangePicker({ startDate, endDate, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [localStart, setLocalStart] = useState(startDate);
  const [localEnd, setLocalEnd] = useState(endDate);

  const apply = (s: string, e: string) => {
    setLocalStart(s);
    setLocalEnd(e);
    onChange(s, e);
    setOpen(false);
  };

  const fmtDisplay = (d: string) =>
    new Date(d + "T12:00:00").toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-card)] border border-[var(--border)] 
          rounded text-[12px] text-[var(--text-2)] hover:border-[var(--border-strong)] hover:text-[var(--text)] 
          transition-all font-mono"
      >
        <CalendarDays size={13} className="text-[var(--accent)]" />
        <span>{fmtDisplay(startDate)}</span>
        <span className="text-[var(--text-3)]">→</span>
        <span>{fmtDisplay(endDate)}</span>
        <ChevronDown size={12} className={`text-[var(--text-3)] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          {/* backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="absolute top-full mt-1.5 right-0 z-50 bg-[var(--bg-card)] border border-[var(--border-strong)] 
            rounded-lg shadow-2xl p-4 w-[340px] animate-slide-in">

            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] uppercase tracking-widest text-[var(--text-3)] font-medium">
                Rango de fechas · LOAN_LIST
              </span>
              <button onClick={() => setOpen(false)} className="text-[var(--text-3)] hover:text-[var(--text)]">
                <X size={13} />
              </button>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => apply(p.start(), p.end())}
                  className="px-2.5 py-1 text-[11px] rounded border border-[var(--border)] 
                    text-[var(--text-3)] hover:border-[var(--accent)] hover:text-[var(--accent)] 
                    transition-all bg-[var(--bg)]"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Manual inputs */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[var(--text-3)] block mb-1">
                  Desde
                </label>
                <input
                  type="date"
                  value={localStart}
                  max={localEnd}
                  onChange={(e) => setLocalStart(e.target.value)}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] 
                    rounded px-2.5 py-1.5 text-[12px] font-mono focus:outline-none 
                    focus:border-[var(--accent)] transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[var(--text-3)] block mb-1">
                  Hasta
                </label>
                <input
                  type="date"
                  value={localEnd}
                  min={localStart}
                  max={today()}
                  onChange={(e) => setLocalEnd(e.target.value)}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] 
                    rounded px-2.5 py-1.5 text-[12px] font-mono focus:outline-none 
                    focus:border-[var(--accent)] transition-colors"
                />
              </div>
            </div>

            {/* Validation hint */}
            {localStart > localEnd && (
              <div className="text-[11px] text-[var(--red)] mb-2">
                ⚠ La fecha inicio no puede ser mayor que la fecha fin
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setOpen(false)}
                className="px-3 py-1.5 text-[11px] text-[var(--text-3)] hover:text-[var(--text)] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => apply(localStart, localEnd)}
                disabled={localStart > localEnd}
                className="px-3 py-1.5 text-[11px] bg-[var(--accent)] text-white rounded 
                  hover:bg-blue-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Aplicar rango
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

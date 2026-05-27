"use client";
import { useState, useEffect, useRef } from "react";
import { Trash2, RefreshCw } from "lucide-react";
import { getLogs, clearLogs, LogEntry } from "@/app/lib/api";
import { Btn, Select } from "@/app/components/ui";

const SOURCE_COLOR: Record<string, string> = {
  sadmin: "text-[var(--accent)]",
  nuovo:  "text-[var(--purple)]",
  knox:   "text-[var(--orange)]",
  sys:    "text-[var(--text-3)]",
};

const LEVEL_COLOR: Record<string, string> = {
  info: "text-[var(--text-2)]",
  ok:   "text-[var(--green)]",
  warn: "text-[var(--yellow)]",
  err:  "text-[var(--red)]",
};

export function LogViewer() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [source, setSource] = useState("all");
  const [level, setLevel] = useState("all");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    setLoading(true);
    const data = await getLogs({ source: source !== "all" ? source : undefined, level: level !== "all" ? level : undefined });
    setLogs(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [source, level]);

  // Auto-refresh every 5s
  useEffect(() => {
    const iv = setInterval(load, 5000);
    return () => clearInterval(iv);
  }, [source, level]);

  const handleClear = async () => {
    await clearLogs();
    setLogs([]);
  };

  const fmtTime = (ts: string) =>
    new Date(ts).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex items-center gap-2">
        <Select value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="all">Todas las fuentes</option>
          <option value="sadmin">Sadmin</option>
          <option value="nuovo">Nuovo</option>
          <option value="knox">Knox</option>
          <option value="sys">Sistema</option>
        </Select>
        <Select value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="all">Todos los niveles</option>
          <option value="info">Info</option>
          <option value="ok">OK</option>
          <option value="warn">Warn</option>
          <option value="err">Error</option>
        </Select>
        <div className="flex-1" />
        <Btn variant="ghost" size="sm" onClick={load} loading={loading}><RefreshCw size={12} /></Btn>
        <Btn variant="ghost" size="sm" onClick={handleClear}><Trash2 size={12} /></Btn>
      </div>

      <div className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-lg p-3 overflow-y-auto font-mono text-[11px] min-h-[400px] max-h-[520px]">
        {logs.length === 0 ? (
          <div className="text-[var(--text-3)] text-center py-8">Sin entradas de log</div>
        ) : (
          logs.map((l) => (
            <div
              key={l.id}
              className="flex gap-3 py-1 hover:bg-[var(--bg-hover)] px-1 rounded items-start"
            >
              <span className="text-[var(--text-3)] min-w-[64px] shrink-0">
                {fmtTime(l.timestamp)}
              </span>

              <span
                className={`min-w-[56px] shrink-0 ${
                  SOURCE_COLOR[l.source] ?? "text-[var(--text-3)]"
                }`}
              >
                [{l.source.toUpperCase()}]
              </span>

              <span
                className={`flex-1 min-w-0 break-words whitespace-pre-wrap ${
                  LEVEL_COLOR[l.level] ?? "text-[var(--text-2)]"
                }`}
              >
                {l.message}
              </span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
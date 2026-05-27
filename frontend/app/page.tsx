"use client";
import { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck, RefreshCw, Play, Lock, AlertTriangle,
  Terminal, Settings, Activity, ChevronRight
} from "lucide-react";
import {
  getDevices, getMetrics, triggerSync, getSchedulerStatus,
  DeviceRecord, DashboardMetrics, SyncResult
} from "@/app/lib/api";
import { MetricCard, Btn, Card, SectionHeader } from "@/app/components/ui";
import { DevicesTable } from "@/app/components/DevicesTable";
import { LogViewer } from "@/app/components/LogViewer";
import { SettingsPanel } from "@/app/components/SettingsPanel";
import { DateRangePicker } from "@/app/components/DateRangePicker";
function firstOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
  }
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
type Tab = "dashboard" | "blocked" | "warning" | "log" | "settings";

const FLOW_STEPS = [
  { key: "token",    label: "Token\nSadmin",     icon: "🔑" },
  { key: "credits",  label: "Listado\ncréditos",  icon: "📋" },
  { key: "moras",    label: "Moras\nidentif",     icon: "⏱" },
  { key: "decision", label: "Evaluar\ndias_mora", icon: "⚡" },
  { key: "nuovo",    label: "Nuovo\nacción",      icon: "📱" },
  { key: "knox",     label: "Knox\nacción",       icon: "🛡" },
  { key: "done",     label: "Listo",              icon: "✓" },
];

export default function Home() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [devices, setDevices] = useState<DeviceRecord[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [flowStep, setFlowStep] = useState(-1);
  const [startDate, setStartDate] = useState(firstOfMonth());
  const [endDate, setEndDate] = useState(todayStr());
  const [schedulerRunning, setSchedulerRunning] = useState(false);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [devs, mets] = await Promise.all([getDevices(), getMetrics()]);
      setDevices(devs);
      setMetrics(mets);
      if (mets.last_sync) setLastSync(new Date(mets.last_sync).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }));
    } catch { /* API not connected yet */ }
  }, []);

  useEffect(() => {
    loadData();
    getSchedulerStatus().then((s) => setSchedulerRunning(s.running)).catch(() => {});
    const iv = setInterval(loadData, 15000);
    return () => clearInterval(iv);
  }, [loadData]);

  const handleSync = async () => {
    setSyncing(true);
    setFlowStep(0);
    for (let i = 0; i < FLOW_STEPS.length; i++) {
      await new Promise((r) => setTimeout(r, 380));
      setFlowStep(i);
    }
    try {
      const result = await triggerSync(startDate,endDate);
      setLastResult(result);
      await loadData();
      const now = new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
      setLastSync(now);
    } catch { }
    setSyncing(false);
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count?: number; countColor?: string }[] = [
    { id: "dashboard", label: "Dashboard",   icon: <Activity size={20} /> },
    { id: "blocked",   label: "Bloqueados",  icon: <Lock size={20} />,         count: metrics?.blocked,  countColor: "var(--red)" },
    { id: "warning",   label: "Advertencia", icon: <AlertTriangle size={20} />, count: metrics?.warning, countColor: "var(--yellow)" },
    { id: "log",       label: "Log",         icon: <Terminal size={20} /> },
    { id: "settings",  label: "Config",      icon: <Settings size={20} /> },
  ];

  const fmt = (n: number) => n?.toLocaleString("es-CO") ?? "—";

  return (
    <div className="min-h-screen flex flex-col">
      {/* HEADER */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur px-8 py-4 shadow-sm">

        {/* LEFT */}
        <div className="flex items-center gap-4">

          <div className="leading-tight">
            <div className="text-[20px] font-semibold tracking-tight text-slate-900">
              Gateway Automation
            </div>

            <div className="text-sm text-slate-500">
              Sadmin • Nuovo • Knox
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-2 ml-2">

          {/* DATE RANGE + SYNC INFO + ACTIONS */}
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onChange={(s, e) => {
              setStartDate(s);
              setEndDate(e);
            }}
          />

          {lastSync && (
            <span className="text-[11px] text-[var(--text-3)] mono">
              sync {lastSync}
            </span>
          )}

          {/* SYNC */}
          <Btn
            variant="default"
            size="sm"
            onClick={handleSync}
            loading={syncing}
          >
            <RefreshCw size={12} /> Sincronizar
          </Btn>

          {/* EXECUTE */}
          <Btn
            variant="primary"
            size="sm"
            onClick={handleSync}
            loading={syncing}
          >
            <Play size={12} /> Ejecutar ahora
          </Btn>

        </div>
      </header>

     {/* TABS */}
        <div className="border-b border-[var(--border)] bg-[var(--bg-card)] px-6 flex">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-[12px] border-b-2 transition-all ${
                tab === t.id
                  ? "border-[var(--accent)] text-[var(--text)] font-medium"
                  : "border-transparent text-[var(--text-3)] hover:text-[var(--text-2)]"
              }`}
            >
              {t.icon}

              <span>{t.label}</span>

              {t.count !== undefined && (
                <span
                  className="
                    ml-1
                    min-w-[20px]
                    h-5
                    px-1.5
                    flex
                    items-center
                    justify-center
                    rounded-full
                    text-[10px]
                    font-semibold
                    mono
                    transition-colors
                  "
                  style={{
                    backgroundColor:
                      (t.count ?? 0) > 0
                        ? `${t.countColor}20`
                        : "var(--bg-hover)",
                    color:
                      (t.count ?? 0) > 0
                        ? t.countColor
                        : "var(--text-3)",
                  }}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

      {/* CONTENT */}
      <main className="flex-1 p-6">
        {tab === "dashboard" && (
          <div className="flex flex-col gap-5 animate-slide-in">
            {/* Metrics */}
            <div className="grid grid-cols-5 gap-5">
              <MetricCard label="Total créditos"  value={metrics?.total ?? "—"}   sub="de Sadmin" />
              <MetricCard label="Al día"          value={metrics?.ok ?? "—"}      sub="0 días mora"  color="text-[var(--green)]" />
              <MetricCard label="Advertencia"     value={metrics?.warning ?? "—"} sub="1 día mora"   color="text-[var(--yellow)]" />
              <MetricCard label="Bloqueados"      value={metrics?.blocked ?? "—"} sub="≥ 2 días mora" color="text-[var(--red)]" />
              <MetricCard label="Mora total"
                value={metrics?.mora_total_sum ? `$${fmt(metrics.mora_total_sum)}` : "$0"}
                sub="suma mora_total" color="text-[var(--red)]" />
            </div>

            {/* Flow */}
            <Card className="p-6">
              <SectionHeader>
                Flujo de ejecución · Sadmin → Nuovo / Knox
              </SectionHeader>

              <div className="flex items-center gap-4 overflow-x-auto py-3 px-1">
                {FLOW_STEPS.map((s, i) => (
                  <div key={s.key} className="flex items-center gap-4">

                    <div className="flex flex-col items-center gap-3 min-w-[110px]">

                      <div
                        className={`
                          w-14 h-14 rounded-2xl
                          flex items-center justify-center
                          text-[24px]
                          border transition-all duration-300
                          shadow-sm
            
                          ${
                            flowStep > i
                              ? "border-(--green)/40 bg-(--green-dim)"
                              : flowStep === i
                              ? "border-(--accent)/60 bg-(--accent-dim) ring-4 ring-(--accent)/15 scale-105"
                              : "border-(--border) bg-(--bg-hover)"
                          }
                        `}
                      >
                        {s.icon}
                      </div>

                      <div className="text-xs text-center text-(--text-2) whitespace-pre-line leading-snug font-medium">
                        {s.label}
                      </div>
                    </div>

                    {i < FLOW_STEPS.length - 1 && (
                      <ChevronRight
                        size={20}
                        className={`
                          shrink-0 transition-colors
                          ${flowStep > i
                            ? "text-(--green)"
                            : "text-(--border-strong)"
                          }
                        `}
                      />
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Last result */}
            {lastResult && (
              <Card className="p-4">
                <SectionHeader>Último ciclo</SectionHeader>
                <div className="grid grid-cols-5 gap-3 text-center">
                  {[
                    { label: "Créditos",     val: lastResult.total_credits, color: "" },
                    { label: "Bloqueados",   val: lastResult.blocked,       color: "text-[var(--red)]" },
                    { label: "Desbloqueados",val: lastResult.unblocked,     color: "text-[var(--green)]" },
                    { label: "Advertencias", val: lastResult.warnings,      color: "text-[var(--yellow)]" },
                    { label: "Duración",     val: `${lastResult.duration_ms}ms`, color: "text-[var(--accent)]" },
                  ].map((m) => (
                    <div key={m.label}>
                      <div className={`text-xl font-semibold mono ${m.color}`}>{m.val}</div>
                      <div className="text-[10px] text-(--text-3) uppercase tracking-wider mt-0.5">{m.label}</div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Table */}
            <Card className="p-4">
              <SectionHeader>Créditos · campos reales de Sadmin</SectionHeader>
              <DevicesTable devices={devices} onRefresh={loadData} />
            </Card>
          </div>
        )}

        {tab === "blocked" && (
          <div className="animate-slide-in">
            <Card className="p-5">
              <SectionHeader>Bloqueados · dias_mora ≥ 2</SectionHeader>
              <DevicesTable devices={devices.filter(d => d.credit_status === "blocked")} onRefresh={loadData} />
            </Card>
          </div>
        )}

        {tab === "warning" && (
          <div className="animate-slide-in">
            <Card className="p-4">
              <SectionHeader>Advertencia · dias_mora = 1 · bloqueo pendiente si no paga</SectionHeader>
              <DevicesTable devices={devices.filter(d => d.credit_status === "warning")} onRefresh={loadData} />
            </Card>
          </div>
        )}

        {tab === "log" && (
          <div className="animate-slide-in">
            <Card className="p-4">
              <SectionHeader>Log de actividad · Sadmin / Nuovo / Knox / Sistema</SectionHeader>
              <LogViewer />
            </Card>
          </div>
        )}

        {tab === "settings" && (
          <div className="animate-slide-in">
            <SettingsPanel />
          </div>
        )}
      </main>
    </div>
  );
}
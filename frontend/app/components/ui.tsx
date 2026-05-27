"use client";
import { ReactNode } from "react";
import { Loader2 } from "lucide-react";

// ─── StatusBadge ─────────────────────────────────────────────────────────────
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; dot: string }> = {
    ok:      { label: "Al día",      dot: "bg-[var(--green)]",  color: "bg-[var(--green-dim)] text-[#15803D] border border-[var(--green)]/25" },
    warning: { label: "Advertencia", dot: "bg-[var(--yellow)]", color: "bg-[var(--yellow-dim)] text-[#92400E] border border-[var(--yellow)]/25" },
    blocked: { label: "Bloqueado",   dot: "bg-[var(--red)]",    color: "bg-[var(--red-light)] text-[var(--red-dark)] border border-[var(--red)]/20" },
  };
  const s = map[status] ?? { label: status, dot: "bg-[var(--text-3)]", color: "bg-[var(--bg-hover)] text-[var(--text-2)] border border-[var(--border)]" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${s.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full inline-block ${s.dot} pulse-dot`} />
      {s.label}
    </span>
  );
}

// ─── GatewayBadge ─────────────────────────────────────────────────────────────
export function GatewayBadge({ status }: { status: string }) {
  const isBlocked = status === "blocked";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold mono tracking-wide ${
      isBlocked
        ? "bg-[var(--red-light)] text-[var(--red-dark)] border border-[var(--red)]/20"
        : "bg-[var(--green-dim)] text-[#15803D] border border-[var(--green)]/25"
    }`}>
      {isBlocked ? "🔒 BLOQUEADA" : "🔓 ACTIVA"}
    </span>
  );
}

// ─── AppBadge ─────────────────────────────────────────────────────────────────
export function AppBadge({ app }: { app: string }) {
  const isKnox = app === "Knox";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold mono ${
      isKnox
        ? "bg-(--orange)/10 text-(--orange) border border-(--orange)/20"
        : "bg-(--purple)/10 text-(--purple) border border-(--purple)/20"
    }`}>
      {app}
    </span>
  );
}

// ─── MoraChip ─────────────────────────────────────────────────────────────────
export function MoraChip({ days }: { days: number }) {
  const color =
    days === 0 ? "text-[#15803D] bg-[var(--green-dim)] border border-[var(--green)]/20"
    : days === 1 ? "text-[#92400E] bg-[var(--yellow-dim)] border border-[var(--yellow)]/20"
    : "text-[var(--red-dark)] bg-[var(--red-light)] border border-[var(--red)]/20";
  return (
    <span className={`mono text-[11px] font-bold px-2 py-0.5 rounded-full ${color}`}>
      {days}d
    </span>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-sm)] ${className}`}>
      {children}
    </div>
  );
}

// ─── MetricCard ───────────────────────────────────────────────────────────────
export function MetricCard({
  label, value, sub, color = "text-[var(--text)]", icon
}: { label: string; value: string | number; sub?: string; color?: string; icon?: ReactNode }) {
  return (
    <Card className="p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1 h-full rounded-r-xl" style={{background: 'var(--red)'}} />
      <div className="flex items-start justify-between mb-2">
        <div className="text-[10px] uppercase tracking-widest text-[var(--text-3)] font-semibold">{label}</div>
        {icon && <div className="text-[var(--text-3)]">{icon}</div>}
      </div>
      <div className={`text-[26px] font-bold mono leading-none ${color}`}>{value}</div>
      {sub && <div className="text-[11px] text-[var(--text-3)] mt-1.5">{sub}</div>}
    </Card>
  );
}

// ─── Button ───────────────────────────────────────────────────────────────────
interface BtnProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "default" | "primary" | "danger" | "success" | "warning" | "ghost";
  size?: "sm" | "md";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}
export function Btn({
  children, onClick, variant = "default", size = "md", disabled, loading, className = ""
}: BtnProps) {
  const base = "inline-flex items-center gap-1.5 rounded-lg font-semibold transition-all duration-150 cursor-pointer border disabled:opacity-40 disabled:cursor-not-allowed select-none active:scale-[0.97]";
  const sz = size === "sm" ? "px-3 py-1.5 text-[11px]" : "px-4 py-2 text-[12px]";
  const v: Record<string, string> = {
    default: "bg-white text-[var(--text-2)] border-[var(--border-strong)] hover:bg-[var(--bg-hover)] hover:border-[var(--text-3)] shadow-[var(--shadow-sm)]",
    primary: "bg-[var(--red)] text-white border-[var(--red-dark)] hover:bg-[var(--red-dark)] shadow-[var(--shadow-sm)]",
    danger:  "bg-[var(--red-light)] text-[var(--red-dark)] border-[var(--red)]/25 hover:bg-[var(--red)]/15",
    success: "bg-[var(--green-dim)] text-[#15803D] border-[var(--green)]/25 hover:bg-[var(--green)]/15",
    warning: "bg-[var(--yellow-dim)] text-[#92400E] border-[var(--yellow)]/25 hover:bg-[var(--yellow)]/15",
    ghost:   "bg-transparent text-[var(--text-3)] border-transparent hover:text-[var(--text-2)] hover:bg-[var(--bg-hover)]",
  };
  return (
    <button
      className={`${base} ${sz} ${v[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading && <Loader2 size={12} className="animate-spin-slow" />}
      {children}
    </button>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
export function SectionHeader({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-0.5 h-4 rounded-full bg-[var(--red)]" />
      <div className="text-[10px] uppercase tracking-widest text-[var(--text-3)] font-bold">
        {children}
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ message }: { message: string }) {
  return (
    <tr>
      <td colSpan={100} className="text-center py-12 text-[var(--text-3)] text-[13px]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[var(--bg-hover)] flex items-center justify-center text-[var(--text-3)]">
            —
          </div>
          {message}
        </div>
      </td>
    </tr>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
export function Input({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text)]
        rounded-lg px-3 py-2 text-[13px] placeholder:text-[var(--text-3)]
        focus:outline-none focus:border-[var(--red)] focus:ring-2 focus:ring-[var(--red)]/10
        transition-all shadow-[var(--shadow-sm)] ${className}`}
      {...props}
    />
  );
}

// ─── Select ───────────────────────────────────────────────────────────────────
export function Select({ className = "", children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`bg-[var(--bg-input)] border border-[var(--border)] text-[var(--text)]
        rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-[var(--red)]
        focus:ring-2 focus:ring-[var(--red)]/10 transition-all cursor-pointer shadow-[var(--shadow-sm)] ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
export function Toggle({
  checked, onChange, label, sub
}: { checked: boolean; onChange: (v: boolean) => void; label: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[var(--border)] last:border-0">
      <div>
        <div className="text-[13px] font-medium text-[var(--text)]">{label}</div>
        {sub && <div className="text-[11px] text-[var(--text-3)] mt-0.5 mono">{sub}</div>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${
          checked ? "bg-[var(--red)]" : "bg-[var(--border-strong)]"
        }`}
        aria-pressed={checked}
      >
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${
          checked ? "left-4.5 translate-x-0.5" : "left-0.5"
        }`} />
      </button>
    </div>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────
export function Divider() {
  return <div className="h-px bg-[var(--border)] my-4" />;
}
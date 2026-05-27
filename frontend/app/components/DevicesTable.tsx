"use client";
import { useState, useMemo } from "react";
import { Lock, Unlock, Search, Filter } from "lucide-react";
import { DeviceRecord, deviceAction, bulkAction } from "@/app/lib/api";
import { StatusBadge, GatewayBadge, AppBadge, MoraChip, Btn, Input, Select, EmptyState } from "@/app/components/ui";
import { ConfirmModal } from "@/app/components/ConfirmModal";

interface Props {
  devices: DeviceRecord[];
  onRefresh: () => void;
}

export function DevicesTable({ devices, onRefresh }: Props) {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [appFilter, setAppFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [modal, setModal] = useState<null | { title: string; body: string; onConfirm: () => Promise<void> }>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return devices.filter((d) => {
      const mq = !q || d.nombre.toLowerCase().includes(q.toLowerCase()) ||
        d.identif.includes(q) || d.num_cred.includes(q);
      const ms = statusFilter === "all" || d.credit_status === statusFilter;
      const ma = appFilter === "all" || d.app === appFilter;
      return mq && ms && ma;
    });
  }, [devices, q, statusFilter, appFilter]);

  const allSelected = filtered.length > 0 && filtered.every((d) => selected.has(d.num_cred));

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? new Set(filtered.map((d) => d.num_cred)) : new Set());
  };

  const toggleOne = (num_cred: string, checked: boolean) => {
    const s = new Set(selected);
    checked ? s.add(num_cred) : s.delete(num_cred);
    setSelected(s);
  };

  const handleAction = (device: DeviceRecord, action: "block" | "unblock") => {
    const label = action === "block" ? "Bloquear" : "Desbloquear";
    setModal({
      title: `${label} pasarela`,
      body: `Cliente: ${device.nombre}\nIdentificación: ${device.identif}\nnum_cred: ${device.num_cred}\nApp: ${device.app}\ndias_mora: ${device.dias_mora}`,
      onConfirm: async () => {
        setLoading(device.num_cred);
        await deviceAction(device.num_cred, device.identif, device.app, action);
        setLoading(null);
        onRefresh();
      },
    });
  };

  const handleBulk = (action: "block" | "unblock") => {
    const ids = [...selected];
    if (!ids.length) return;
    const label = action === "block" ? "Bloquear" : "Desbloquear";
    setModal({
      title: `${label} ${ids.length} dispositivo(s)`,
      body: `Se aplicará ${label.toLowerCase()} a ${ids.length} crédito(s) seleccionado(s) vía Nuovo y Knox según corresponda.`,
      onConfirm: async () => {
        await bulkAction(ids, action);
        setSelected(new Set());
        onRefresh();
      },
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
  <div className="relative flex-1 min-w-[280px]">

    <Input
      className="pl-11"
      placeholder="Buscar nombre, identificación, num_cred..."
      value={q}
      onChange={(e) => setQ(e.target.value)}
    />
  </div>

  <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
    <option value="all">Todos los estados</option>
    <option value="ok">Al día (0 días)</option>
    <option value="warning">Advertencia (1 día)</option>
    <option value="blocked">Bloqueados (≥2 días)</option>
  </Select>

  <Select value={appFilter} onChange={(e) => setAppFilter(e.target.value)}>
    <option value="all">Nuovo + Knox</option>
    <option value="Nuovo">Nuovo</option>
    <option value="Knox">Knox</option>
  </Select>
</div>

      {/* Table wrapper — horizontally scrollable on mobile */}
      <div className="border border-(--border) rounded-xl overflow-hidden shadow-[var(--shadow-sm)]">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]" style={{ tableLayout: "fixed", minWidth: 860 }}>
            <colgroup>
              <col style={{ width: 36 }} />
              <col style={{ width: 170 }} />
              <col style={{ width: 110 }} />
              <col style={{ width: 115 }} />
              <col style={{ width: 120 }} />
              <col style={{ width: 70 }} />
              <col style={{ width: 72 }} />
              <col style={{ width: 105 }} />
              <col style={{ width: 105 }} />
              <col style={{ width: 95 }} />
            </colgroup>
            <thead>
              <tr className="bg-[var(--bg)] border-b border-[var(--border)]">
                <th className="px-3 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => toggleAll(e.target.checked)}
                    className="accent-[var(--red)] w-3.5 h-3.5"
                  />
                </th>
                {["Nombre", "Identificación", "num_cred", "Tipo crédito", "App",
                  "dias_mora", "mora_total", "Estado", "Pasarela"].map((h) => (
                  <th key={h} className="px-3 py-3 text-left text-[10px] uppercase tracking-widest text-[var(--text-3)] font-bold">{h}</th>
                ))}
                <th className="px-3 py-3 text-left text-[10px] uppercase tracking-widest text-[var(--text-3)] font-bold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.length === 0 ? (
                <EmptyState message="Sin resultados para los filtros aplicados" />
              ) : (
                filtered.map((d, i) => (
                  <tr
                    key={d.num_cred}
                    className={`hover:bg-[var(--bg-hover)] transition-colors duration-100 ${
                      selected.has(d.num_cred) ? "bg-[var(--red-dim)]" : i % 2 === 0 ? "bg-white" : "bg-[#FAFBFC]"
                    }`}
                  >
                    <td className="px-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={selected.has(d.num_cred)}
                        onChange={(e) => toggleOne(d.num_cred, e.target.checked)}
                        className="accent-[var(--red)] w-3.5 h-3.5"
                      />
                    </td>
                    <td className="px-3 py-2.5 overflow-hidden text-ellipsis whitespace-nowrap font-medium text-[var(--text)]" title={d.nombre}>
                      {d.nombre}
                    </td>
                    <td className="px-3 py-2.5 mono text-[11px] text-[var(--text-2)]">{d.identif}</td>
                    <td className="px-3 py-2.5 mono text-[11px] text-[var(--text-2)]">{d.num_cred}</td>
                    <td className="px-3 py-2.5 text-[11px] text-[var(--text-3)] overflow-hidden text-ellipsis whitespace-nowrap">{d.nom_tipocred}</td>
                    <td className="px-3 py-2.5"><AppBadge app={d.app} /></td>
                    <td className="px-3 py-2.5"><MoraChip days={d.dias_mora} /></td>
                    <td className="px-3 py-2.5 mono text-[11px] text-[var(--text-2)]">
                      {d.mora_total > 0 ? `$${d.mora_total.toLocaleString("es-CO")}` : <span className="text-[var(--text-3)]">—</span>}
                    </td>
                    <td className="px-3 py-2.5"><StatusBadge status={d.credit_status} /></td>
                    <td className="px-3 py-2.5"><GatewayBadge status={d.gateway} /></td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1">
                        <Btn size="sm" variant="danger" loading={loading === d.num_cred}
                          onClick={() => handleAction(d, "block")}
                          className="!px-2 !py-1">
                          <Lock size={10} />
                        </Btn>
                        <Btn size="sm" variant="success" loading={loading === d.num_cred}
                          onClick={() => handleAction(d, "unblock")}
                          className="!px-2 !py-1">
                          <Unlock size={10} />
                        </Btn>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-wrap justify-between items-center gap-2">
        <span className="text-[11px] text-[var(--text-3)]">
          {filtered.length} de {devices.length} créditos
          {selected.size > 0 && (
            <span className="ml-2 font-semibold text-[var(--red)]">· {selected.size} seleccionados</span>
          )}
        </span>
        <div className="flex gap-2 flex-wrap">
          <Btn variant="danger" size="sm" onClick={() => handleBulk("block")} disabled={selected.size === 0}>
            <Lock size={11} /> Bloquear selección
          </Btn>
          <Btn variant="success" size="sm" onClick={() => handleBulk("unblock")} disabled={selected.size === 0}>
            <Unlock size={11} /> Desbloquear selección
          </Btn>
        </div>
      </div>

      {modal && (
        <ConfirmModal
          title={modal.title}
          body={modal.body}
          onConfirm={async () => { await modal.onConfirm(); setModal(null); }}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  );
}
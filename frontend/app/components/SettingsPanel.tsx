"use client";
import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { getSettings, testConnection } from "@/app//lib/api";
import { Card, Btn, Input, Toggle, SectionHeader } from "@/app/components/ui";

type ConnStatus = "idle" | "testing" | "ok" | "fail";

function ApiCard({
  title, apiKey, fields,
}: {
  title: string;
  apiKey: string;
  fields: { key: string; label: string; type?: string; value: string; mono?: boolean }[];
}) {
  const [status, setStatus] = useState<ConnStatus>("idle");
  const [msg, setMsg] = useState("");

  const handleTest = async () => {
    setStatus("testing");
    try {
      const res = await testConnection(apiKey);
      setStatus(res.success ? "ok" : "fail");
      setMsg(res.message);
    } catch {
      setStatus("fail");
      setMsg("Error de conexión");
    }
  };

  return (
    <Card className="overflow-hidden">
      {/* Card header */}
      <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--bg)]">
        <div className="text-[12px] font-bold text-[var(--text)] tracking-wide">{title}</div>
      </div>
      <div className="p-4">
        <div className="flex flex-col gap-3">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="text-[10px] uppercase tracking-widest text-[var(--text-3)] block mb-1 font-bold">{f.label}</label>
              <Input
                type={f.type ?? "text"}
                defaultValue={f.value}
                placeholder={f.label}
                className={f.mono ? "font-mono text-[11px]" : ""}
              />
            </div>
          ))}
        </div>

        <Btn variant="primary" className="w-full mt-4 justify-center" onClick={handleTest} loading={status === "testing"}>
          Probar conexión
        </Btn>

        {status !== "idle" && status !== "testing" && (
          <div className={`flex items-center gap-2 mt-3 text-[11px] px-3 py-2 rounded-lg font-mono ${
            status === "ok"
              ? "bg-[var(--green-dim)] text-[#15803D] border border-[var(--green)]/20"
              : "bg-[var(--red-light)] text-[var(--red-dark)] border border-[var(--red)]/20"
          }`}>
            {status === "ok" ? <CheckCircle size={13} /> : <XCircle size={13} />}
            {msg}
          </div>
        )}
      </div>
    </Card>
  );
}

export function SettingsPanel() {
  const [settings, setSettings] = useState<any>(null);
  const [autoBlock, setAutoBlock] = useState(true);
  const [autoUnblock, setAutoUnblock] = useState(true);
  const [autoWarn, setAutoWarn] = useState(true);

  useEffect(() => {
    getSettings().then((s) => {
      setSettings(s);
      setAutoBlock(s.scheduler?.auto_block ?? true);
      setAutoUnblock(s.scheduler?.auto_unblock ?? true);
      setAutoWarn(s.scheduler?.auto_warn ?? true);
    }).catch(() => {});
  }, []);

  if (!settings) return (
    <div className="flex items-center gap-2 text-[var(--text-3)] text-[13px] py-8">
      <Loader2 size={16} className="animate-spin-slow text-[var(--red)]" /> Cargando configuración...
    </div>
  );

  return (
    <div className="flex flex-col gap-6">

      {/* ── Sadmin ── */}
      <div>
        <SectionHeader>Sadmin · Autenticación y reportes</SectionHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ApiCard
            title="🔑 Sadmin · Login"
            apiKey="sadmin"
            fields={[
              { key: "login_url", label: "URL de login",  value: settings.sadmin?.login_url ?? "https://security.sadmin.net/security/login", mono: true },
              { key: "user",      label: "Usuario",        value: settings.sadmin?.user ?? "" },
              { key: "pass",      label: "Contraseña",     type: "password", value: "" },
            ]}
          />
          <Card className="overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--bg)]">
              <div className="text-[12px] font-bold text-[var(--text)]">📊 Sadmin · Reportes</div>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[var(--text-3)] block mb-1 font-bold">URL reportes</label>
                <Input defaultValue={settings.sadmin?.reports_url ?? "https://reports.sadmin.net/api/generate_report"} className="font-mono text-[11px]" />
              </div>
              <div className="mt-1 space-y-2.5">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-[var(--text-3)] mb-1.5 font-bold">Payload créditos (LOAN_LIST)</div>
                  <div className="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-3 font-mono text-[10px] text-[var(--text-3)] leading-relaxed">
                    {`{\n  "reportid": "LOAN_LIST",\n  "start_date": "YYYY-MM-01",\n  "end_date": "YYYY-MM-DD",\n  "balance_type": 1,\n  "credit_type": "ALL",\n  "branch": "ALL"\n}`}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-[var(--text-3)] mb-1.5 font-bold">Payload moras (TOTAL_DEFAULT_BY_DEBTOR)</div>
                  <div className="bg-[var(--bg)] border border-[var(--border)] rounded-lg p-3 font-mono text-[10px] text-[var(--text-3)] leading-relaxed">
                    {`{\n  "reportid": "TOTAL_DEFAULT_BY_DEBTOR",\n  "cutoff_date": "YYYY-MM-DD",\n  "number_of_decimals": 0,\n  "identif": "{identif}"\n}`}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ── Nuovo + Knox ── */}
      <div>
        <SectionHeader>Nuovo y Knox · Bloqueo / Desbloqueo</SectionHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <ApiCard
            title="📱 Nuovo API · Basic Auth"
            apiKey="nuovo"
            fields={[
              { key: "url",      label: "URL base",           value: settings.nuovo?.base_url ?? "", mono: true },
              { key: "user",     label: "Usuario",             value: settings.nuovo?.user ?? "" },
              { key: "pass",     label: "Contraseña",          type: "password", value: "" },
              { key: "block",    label: "Endpoint bloqueo",    value: settings.nuovo?.ep_block ?? "/device/block", mono: true },
              { key: "unblock",  label: "Endpoint desbloqueo", value: settings.nuovo?.ep_unblock ?? "/device/unblock", mono: true },
            ]}
          />
          <ApiCard
            title="🛡 Knox API · Basic Auth"
            apiKey="knox"
            fields={[
              { key: "url",      label: "URL base",           value: settings.knox?.base_url ?? "", mono: true },
              { key: "user",     label: "Usuario",             value: settings.knox?.user ?? "" },
              { key: "pass",     label: "Contraseña",          type: "password", value: "" },
              { key: "block",    label: "Endpoint bloqueo",    value: settings.knox?.ep_block ?? "/mdm/restrict", mono: true },
              { key: "unblock",  label: "Endpoint desbloqueo", value: settings.knox?.ep_unblock ?? "/mdm/allow", mono: true },
            ]}
          />
        </div>
      </div>

      {/* ── Reglas + Scheduler ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--bg)]">
            <div className="text-[12px] font-bold text-[var(--text)]">⚙️ Reglas de negocio · dias_mora</div>
          </div>
          <div className="p-4">
            <div className="bg-[var(--bg)] border border-[var(--border)] rounded-xl p-4 space-y-3 font-mono text-[12px]">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-[var(--green)] pulse-dot shrink-0" />
                <span className="text-[#15803D] font-semibold">dias_mora = 0</span>
                <span className="text-[var(--text-3)] ml-auto text-[11px]">→ DESBLOQUEO</span>
              </div>
              <div className="h-px bg-[var(--border)]" />
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-[var(--yellow)] pulse-dot shrink-0" />
                <span className="text-[#92400E] font-semibold">dias_mora = 1</span>
                <span className="text-[var(--text-3)] ml-auto text-[11px]">→ ADVERTENCIA</span>
              </div>
              <div className="h-px bg-[var(--border)]" />
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-[var(--red)] pulse-dot shrink-0" />
                <span className="text-[var(--red-dark)] font-semibold">dias_mora ≥ 2</span>
                <span className="text-[var(--text-3)] ml-auto text-[11px]">→ BLOQUEO</span>
              </div>
            </div>
            <div className="mt-3 text-[11px] text-[var(--text-3)] leading-relaxed">
              Campos usados de Sadmin:{" "}
              {["identif", "num_cred", "nombre", "dias_mora", "mora_total"].map((f, i, arr) => (
                <span key={f}>
                  <span className="font-mono text-[var(--text-2)] bg-[var(--bg-hover)] px-1 py-0.5 rounded">{f}</span>
                  {i < arr.length - 1 && ", "}
                </span>
              ))}
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--bg)]">
            <div className="text-[12px] font-bold text-[var(--text)]">🕐 Automatización · Scheduler</div>
          </div>
          <div className="p-4">
            <div className="flex flex-col">
              <Toggle
                label="Bloqueo automático"
                sub="dias_mora ≥ 2 → POST Nuovo/Knox block"
                checked={autoBlock}
                onChange={setAutoBlock}
              />
              <Toggle
                label="Desbloqueo automático"
                sub="dias_mora = 0 → POST Nuovo/Knox unblock"
                checked={autoUnblock}
                onChange={setAutoUnblock}
              />
              <Toggle
                label="Advertencias en log"
                sub="dias_mora = 1 → registro sin bloquear"
                checked={autoWarn}
                onChange={setAutoWarn}
              />
            </div>
            <Btn variant="primary" className="w-full mt-4 justify-center">
              Guardar configuración
            </Btn>
          </div>
        </Card>
      </div>
    </div>
  );
}
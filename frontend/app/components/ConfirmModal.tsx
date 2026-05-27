"use client";
import { useState } from "react";
import { Btn } from "@/app/components/ui";

interface Props {
  title: string;
  body: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export function ConfirmModal({ title, body, onConfirm, onCancel }: Props) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handle = async () => {
    setLoading(true);
    // Animate progress bar
    const iv = setInterval(() => {
      setProgress((p) => (p >= 90 ? 90 : p + 15));
    }, 80);
    try {
      await onConfirm();
      setProgress(100);
    } finally {
      clearInterval(iv);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-slide-in">
      <div className="bg-[var(--bg-card)] border border-[var(--border-strong)] rounded-xl p-5 w-[400px] shadow-2xl">
        <div className="text-[14px] font-semibold mb-2 text-[var(--text)]">{title}</div>
        <div className="text-[12px] text-[var(--text-2)] mb-4 whitespace-pre-line mono leading-relaxed bg-[var(--bg)] border border-[var(--border)] rounded p-3">
          {body}
        </div>
        {loading && (
          <div className="h-0.5 bg-[var(--border)] rounded mb-4 overflow-hidden">
            <div
              className="h-full bg-[var(--accent)] rounded transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        <div className="flex gap-2 justify-end">
          <Btn variant="default" onClick={onCancel} disabled={loading}>Cancelar</Btn>
          <Btn variant="primary" onClick={handle} loading={loading}>Confirmar</Btn>
        </div>
      </div>
    </div>
  );
}
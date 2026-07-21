"use client";

import { useEffect, useState } from "react";
import { toast } from "@/lib/toast";

type ToastItem = {
  id: number;
  message: string;
  type: "success" | "error" | "info";
};

const STYLES = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200",
  error: "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-700 dark:bg-rose-900/40 dark:text-rose-200",
  info: "border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100",
};

const ICONS = {
  success: "✓",
  error: "✕",
  info: "ℹ",
};

export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    toast._register((message, type) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
    });
    return () => toast._unregister();
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${STYLES[t.type]}`}
        >
          <span className="text-base leading-none">{ICONS[t.type]}</span>
          {t.message}
        </div>
      ))}
    </div>
  );
}

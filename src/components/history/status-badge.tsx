"use client";

import { useState } from "react";
import { toast } from "@/lib/toast";

const STATUS_STYLES = {
  draft: "bg-slate-100 text-slate-600 ring-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:ring-slate-600",
  sent: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-700",
  interview: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-700",
  won: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-700",
  lost: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:ring-rose-700",
} as const;

type Status = keyof typeof STATUS_STYLES;

export function StatusBadge({
  proposalId,
  initialStatus,
}: {
  proposalId: string;
  initialStatus: Status;
}) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [updating, setUpdating] = useState(false);

  async function handleChange(newStatus: Status) {
    setUpdating(true);
    try {
      const res = await fetch(`/api/proposals/${proposalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      setStatus(newStatus);
      toast.success(`Status: ${newStatus}`);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <select
      value={status}
      disabled={updating}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => {
        e.stopPropagation();
        void handleChange(e.target.value as Status);
      }}
      className={`cursor-pointer rounded-lg border-0 px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition-all disabled:cursor-not-allowed disabled:opacity-50 ${STATUS_STYLES[status]}`}
    >
      {(Object.keys(STATUS_STYLES) as Status[]).map((s) => (
        <option key={s} value={s}>
          {s.charAt(0).toUpperCase() + s.slice(1)}
        </option>
      ))}
    </select>
  );
}

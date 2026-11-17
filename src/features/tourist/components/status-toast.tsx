"use client";

import { useState } from "react";

export function StatusToast({ message, success }: { message: string; success: boolean }) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return <div role="status" aria-live="polite" className={`fixed bottom-5 right-4 z-[100] flex max-w-[min(28rem,calc(100vw-2rem))] items-start gap-4 rounded-2xl border px-4 py-3 text-sm shadow-xl sm:bottom-6 sm:right-6 ${success ? "border-emerald-200 bg-emerald-50 text-emerald-950" : "border-rose-200 bg-rose-50 text-rose-950"}`}>
    <span>{message}</span><button type="button" onClick={() => setVisible(false)} aria-label="Dismiss message" className="shrink-0 font-semibold opacity-70 hover:opacity-100">×</button>
  </div>;
}

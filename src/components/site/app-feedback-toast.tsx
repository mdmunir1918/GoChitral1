"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

export function AppFeedbackToast() {
  const params = useSearchParams();
  const error = params.get("error");
  const successKey = ["saved", "roomSaved", "roomDeleted", "reviewed", "created", "updated", "submitted", "deleted"].find((key) => params.has(key));
  const message = error
    ? "We couldn't complete that. Check the form and try again."
    : successKey === "reviewed"
      ? "The application review was saved."
      : successKey === "submitted"
        ? "Your submission was received successfully."
      : successKey
        ? "Your changes were saved successfully."
        : null;
  const queryKey = params.toString();
  const [dismissedKey, setDismissedKey] = useState("");
  if (!message || dismissedKey === queryKey) return null;
  return <div role={error ? "alert" : "status"} aria-live="polite" className={`fixed bottom-5 right-4 z-[100] flex max-w-[min(28rem,calc(100vw-2rem))] items-start gap-4 rounded-2xl border px-4 py-3 text-sm shadow-xl sm:bottom-6 sm:right-6 ${error ? "border-rose-200 bg-rose-50 text-rose-950" : "border-emerald-200 bg-emerald-50 text-emerald-950"}`}>
    <span>{message}</span><button type="button" onClick={() => setDismissedKey(queryKey)} aria-label="Dismiss message" className="shrink-0 font-semibold opacity-70 hover:opacity-100">×</button>
  </div>;
}

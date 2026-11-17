import { AlertCircle, Inbox, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function LoadingState({ label = "Loading", className }: { label?: string; className?: string }) {
  return <div role="status" className={cn("flex min-h-40 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-white p-8 text-center text-sm text-muted", className)}>
    <LoaderCircle size={22} className="animate-spin text-primary" aria-hidden="true" />
    <span>{label}</span>
  </div>;
}

export function EmptyState({ title, description, className }: { title: string; description: string; className?: string }) {
  return <div className={cn("flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-white p-8 text-center", className)}>
    <Inbox size={24} className="text-muted" aria-hidden="true" />
    <h2 className="mt-3 text-base font-semibold">{title}</h2>
    <p className="mt-1 max-w-md text-sm leading-6 text-muted">{description}</p>
  </div>;
}

export function ErrorState({ title = "Something went wrong", description, className }: { title?: string; description: string; className?: string }) {
  return <div role="alert" className={cn("flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-900", className)}>
    <AlertCircle size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
    <div><h2 className="font-semibold">{title}</h2><p className="mt-1 text-sm leading-6 text-red-800">{description}</p></div>
  </div>;
}

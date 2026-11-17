import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string };

export function TextField({ label, className, ...props }: TextFieldProps) {
  return (
    <label className="grid gap-2 text-sm font-medium text-foreground">
      {label}
      <input
        className={cn("h-11 w-full rounded-xl border border-border bg-white px-3.5 text-sm font-normal outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/15", className)}
        {...props}
      />
    </label>
  );
}

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string };

export function TextAreaField({ label, className, ...props }: TextAreaFieldProps) {
  return (
    <label className="grid gap-2 text-sm font-medium text-foreground">
      {label}
      <textarea
        className={cn("min-h-28 w-full resize-y rounded-xl border border-border bg-white px-3.5 py-3 text-sm font-normal leading-6 outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/15", className)}
        {...props}
      />
    </label>
  );
}

export function AuthActionError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      {message}
    </p>
  );
}

"use client";

import Link from "next/link";
import { useActionState } from "react";

import { AuthActionError, TextField } from "@/components/auth/form-field";
import { Button } from "@/components/ui/button";
import { requestPasswordReset } from "@/features/auth/actions";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, {});

  if (state.status === "RESET_REQUESTED") {
    return (
      <div className="grid gap-5">
        <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950">
          If an account uses that email, we’ve sent a reset link. Check your inbox and spam folder.
        </p>
        <Link className="text-center text-sm font-medium text-emerald-900 hover:underline" href="/login">Return to sign in</Link>
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-5">
      <TextField label="Email address" name="email" type="email" autoComplete="email" required />
      <AuthActionError message={state.error} />
      <Button type="submit" disabled={pending} className="w-full">{pending ? "Sending link…" : "Send reset link"}</Button>
      <p className="text-center text-sm text-stone-500"><Link className="font-medium text-emerald-900 hover:underline" href="/login">Back to sign in</Link></p>
    </form>
  );
}

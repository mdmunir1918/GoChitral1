"use client";

import Link from "next/link";
import { useActionState } from "react";

import { AuthActionError, TextField } from "@/components/auth/form-field";
import { Button } from "@/components/ui/button";
import { resetPassword } from "@/features/auth/actions";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPassword, {});

  if (state.status === "PASSWORD_RESET") {
    return (
      <div className="grid gap-5">
        <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950">Your password has been updated. You can sign in with your new password.</p>
        <Link className="text-center text-sm font-medium text-emerald-900 hover:underline" href="/login">Go to sign in</Link>
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-5">
      <input type="hidden" name="token" value={token} />
      <TextField label="New password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={72} required />
      <TextField label="Confirm new password" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} maxLength={72} required />
      <AuthActionError message={state.error} />
      {state.error && <p className="-mt-3 text-sm text-stone-600">Need a fresh link? <Link className="font-medium text-emerald-900 hover:underline" href="/forgot-password">Request another reset link</Link>.</p>}
      <Button type="submit" disabled={pending} className="w-full">{pending ? "Updating password…" : "Update password"}</Button>
    </form>
  );
}

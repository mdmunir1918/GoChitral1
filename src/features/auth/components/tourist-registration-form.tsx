"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { AuthActionError, TextField } from "@/components/auth/form-field";
import { registerTourist } from "@/features/auth/actions";
import { ExistingAccountMessage } from "./existing-account-message";

export function TouristRegistrationForm() {
  const [state, action, pending] = useActionState(registerTourist, {});

  return (
    <form action={action} className="grid gap-5">
      <TextField label="Your name" name="name" autoComplete="name" required maxLength={100} />
      <TextField label="Email" name="email" type="email" autoComplete="email" required />
      <TextField label="Password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={72} required />
      {state.status === "EMAIL_EXISTS" ? <ExistingAccountMessage /> : <AuthActionError message={state.error} />}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creating account…" : "Create tourist account"}
      </Button>
      <p className="text-center text-sm text-stone-500">
        Already registered? <Link className="font-medium text-emerald-900 hover:underline" href="/login">Sign in</Link>
      </p>
      <div className="border-t border-stone-200 pt-5 text-sm leading-6 text-stone-500">
        Applying as a provider? <Link className="font-medium text-emerald-900 hover:underline" href="/register/guide">Tour guide</Link>
        {" · "}<Link className="font-medium text-emerald-900 hover:underline" href="/register/hotel">Hotel owner</Link>
      </div>
    </form>
  );
}

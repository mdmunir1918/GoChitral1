"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { AuthActionError, TextField } from "@/components/auth/form-field";
import { login, signInWithGoogle } from "@/features/auth/actions";

export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const [state, action, pending] = useActionState(login, {});

  return (
    <div className="grid gap-5">
      {googleEnabled ? (
        <>
          <form action={signInWithGoogle}>
            <Button type="submit" variant="outline" className="w-full">Continue with Google</Button>
          </form>
          <div className="flex items-center gap-3 text-xs text-stone-400"><span className="h-px flex-1 bg-stone-200" />or use email<span className="h-px flex-1 bg-stone-200" /></div>
        </>
      ) : null}
      <form action={action} className="grid gap-5">
        <TextField label="Email" name="email" type="email" autoComplete="email" required />
        <TextField label="Password" name="password" type="password" autoComplete="current-password" required />
        <Link className="-mt-3 justify-self-end text-sm font-medium text-emerald-900 hover:underline" href="/forgot-password">Forgot password?</Link>
        <AuthActionError message={state.error} />
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      {!googleEnabled ? (
        <p className="text-xs leading-5 text-stone-500">Google sign-in will be available after the OAuth credentials are configured.</p>
      ) : null}
      <p className="text-center text-sm text-stone-500">
        New to GoChitral? <Link className="font-medium text-emerald-900 hover:underline" href="/register">Create an account</Link>
      </p>
    </div>
  );
}

import Link from "next/link";

export function ExistingAccountMessage() {
  return (
    <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <p>It looks like you already have an account with this email. Sign in or reset your password to continue.</p>
      <p className="mt-2 flex gap-3 font-medium">
        <Link className="underline underline-offset-2" href="/login">Sign in</Link>
        <Link className="underline underline-offset-2" href="/forgot-password">Forgot password?</Link>
      </p>
    </div>
  );
}

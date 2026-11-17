import Link from "next/link";
import { requireAccountType } from "@/lib/authz";

export const instant = false;

export default async function TouristSettingsPage() {
  const user = await requireAccountType(["TOURIST"]);
  return <section className="grid gap-5 rounded-2xl border border-border bg-white p-5 sm:p-7"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Security and sign-in</p><h2 className="mt-2 text-2xl font-medium">Account settings</h2></div><div className="rounded-xl bg-background p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted">Signed-in email</p><p className="mt-1 text-sm">{user.email ?? "No email on file"}</p></div><div className="rounded-xl border border-border p-4"><h3 className="font-semibold">Password</h3><p className="mt-1 text-sm leading-6 text-muted">Request a secure password reset link if you use email and password to sign in.</p><Link href="/forgot-password" className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline">Reset my password</Link></div><p className="text-xs leading-5 text-muted">Your account details and saved listings are private. Account deletion is not available yet; contact support for help with account removal.</p></section>;
}

import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

export const instant = false;

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
    return (
      <AuthShell title="Reset your password" description="This reset link is missing or invalid.">
        <Link className="block text-center text-sm font-medium text-emerald-900 hover:underline" href="/forgot-password">Request a new reset link</Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Choose a new password" description="Use at least 8 characters for your new password.">
      <ResetPasswordForm token={token} />
    </AuthShell>
  );
}

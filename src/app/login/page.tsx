import { redirectSignedInUser } from "@/lib/authz";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/features/auth/components/login-form";

export const instant = false;

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ loggedOut?: string }> }) {
  const params = await searchParams;
  await redirectSignedInUser();
  const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

  return (
    <AuthShell title="Welcome back" description="Sign in to continue exploring Chitral.">
      {params.loggedOut === "1" && <p role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">You have been signed out.</p>}
      <LoginForm googleEnabled={googleEnabled} />
    </AuthShell>
  );
}

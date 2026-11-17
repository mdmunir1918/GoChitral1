import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { GuideApplicationForm } from "@/features/auth/components/guide-application-form";
import { redirectSignedInUser } from "@/lib/authz";

export const instant = false;

export default async function GuideRegistrationPage() {
  await redirectSignedInUser();

  return (
    <AuthShell title="Apply as a local guide" description="Tell us about your experience and the places you know. Applications are reviewed before provider profiles can be published.">
      <GuideApplicationForm />
      <p className="mt-6 text-center text-sm text-stone-500">Registering as a hotel owner? <Link className="font-medium text-emerald-900 hover:underline" href="/register/hotel">Apply here</Link></p>
    </AuthShell>
  );
}

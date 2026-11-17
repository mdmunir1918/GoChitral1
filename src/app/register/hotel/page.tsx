import Link from "next/link";

import { AuthShell } from "@/components/auth/auth-shell";
import { HotelApplicationForm } from "@/features/auth/components/hotel-application-form";
import { redirectSignedInUser } from "@/lib/authz";

export const instant = false;

export default async function HotelRegistrationPage() {
  await redirectSignedInUser();

  return (
    <AuthShell title="Apply as a hotel owner" description="Submit your hotel details for review. Your listing will not be public unless it is approved.">
      <HotelApplicationForm />
      <p className="mt-6 text-center text-sm text-stone-500">Applying as a local guide? <Link className="font-medium text-emerald-900 hover:underline" href="/register/guide">Apply here</Link></p>
    </AuthShell>
  );
}

import { redirectSignedInUser } from "@/lib/authz";
import { AuthShell } from "@/components/auth/auth-shell";
import { TouristRegistrationForm } from "@/features/auth/components/tourist-registration-form";

export const instant = false;

export default async function RegisterPage() {
  await redirectSignedInUser();

  return (
    <AuthShell title="Create your account" description="Save places and start planning a private trip through Chitral.">
      <TouristRegistrationForm />
    </AuthShell>
  );
}

import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form";

export const instant = false;

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Reset your password" description="Enter the email address on your account and we’ll send you a reset link.">
      <ForgotPasswordForm />
    </AuthShell>
  );
}

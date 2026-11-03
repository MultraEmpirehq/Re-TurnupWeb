import ResetPasswordForm from "@/components/pages/auth/reset-password-form";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default function OtpPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

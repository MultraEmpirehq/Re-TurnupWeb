import RegisterTokenForm from "@/components/pages/auth/register-token-form";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

const Fallback = () => <div className="min-h-[320px]" />;

export default function RegisterTokenPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <RegisterTokenForm />
    </Suspense>
  );
}

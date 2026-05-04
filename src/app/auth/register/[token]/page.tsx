import SectionContainer from "@/components/layouts/section-container/section-container";
import RegisterTokenForm from "@/components/pages/auth/register-token-form";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

const Fallback = () => (
  <SectionContainer className="flex flex-col items-center justify-center min-h-full py-10 md:py-16" />
);

export default function RegisterTokenPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <RegisterTokenForm />
    </Suspense>
  );
}

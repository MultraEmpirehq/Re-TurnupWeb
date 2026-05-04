import SectionContainer from "@/components/layouts/section-container/section-container";
import AuthForm from "@/components/pages/auth/auth-form";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

const Fallback = () => (
  <SectionContainer className="flex flex-col items-center justify-center min-h-full py-10 md:py-16" />
);

export default function AuthPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <AuthForm />
    </Suspense>
  );
}

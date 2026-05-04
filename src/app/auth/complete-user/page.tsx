import SectionContainer from "@/components/layouts/section-container/section-container";
import CompleteUserForm from "@/components/pages/auth/complete-user-form";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

const Fallback = () => (
  <SectionContainer className="flex flex-col items-center justify-center min-h-full py-10 md:py-16">
    <div className="flex flex-col items-center justify-center w-full max-w-sm gap-5">
      <Skeleton className="h-8 w-3/4 rounded-md" />
      <Skeleton className="h-4 w-full rounded-md" />
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full rounded-md" />
      ))}
      <Skeleton className="h-10 w-full rounded-md" />
    </div>
  </SectionContainer>
);

export default function CompleteUserPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <CompleteUserForm />
    </Suspense>
  );
}

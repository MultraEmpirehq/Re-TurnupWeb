import CompleteUserForm from "@/components/pages/auth/complete-user-form";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

const Fallback = () => (
  <div className="flex w-full flex-col gap-5">
    <Skeleton className="h-4 w-28 rounded-md" />
    <Skeleton className="h-8 w-3/4 rounded-md" />
    {Array.from({ length: 5 }).map((_, i) => (
      <Skeleton key={i} className="h-12 w-full rounded-xl" />
    ))}
    <Skeleton className="h-12 w-full rounded-full" />
  </div>
);

export default function CompleteUserPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <CompleteUserForm />
    </Suspense>
  );
}

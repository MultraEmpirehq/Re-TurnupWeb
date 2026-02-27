import { Skeleton } from "@/components/ui/skeleton";

export default function EventDetailLoading() {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-10 space-y-6">
      <Skeleton className="h-64 w-full rounded-xl" />
      <div className="space-y-3">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-5 w-1/4" />
      </div>
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  );
}

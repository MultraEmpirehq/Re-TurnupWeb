import BrandLoader from "@/components/ui/brand-loader";

// Shown while a page without its own skeleton loads.
export default function Loading() {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center">
      <BrandLoader />
    </div>
  );
}

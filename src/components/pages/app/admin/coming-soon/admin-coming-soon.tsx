import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/variables";
import { ArrowLeft, Hourglass } from "lucide-react";
import Link from "next/link";
import React, { memo } from "react";

const AdminComingSoon: React.FC<{
  department: string;
  title: string;
  description: string;
}> = ({ department, title, description }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-bold tracking-[0.08em] text-muted-foreground uppercase">
          {department}
        </p>
        <h1 className="text-xl font-bold text-secondary-800">{title}</h1>
      </div>

      <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-xl bg-secondary-50 text-secondary-800">
          <Hourglass className="size-6" aria-hidden />
        </span>
        <div className="max-w-md space-y-1">
          <p className="font-semibold text-foreground">Coming soon</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Button asChild variant="outline">
          <Link href={ROUTES.ADMIN_OVERVIEW.href}>
            <ArrowLeft />
            Back to Overview
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default memo(AdminComingSoon);

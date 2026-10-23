import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import React, { memo } from "react";
import { ROUTES } from "@/lib/variables";

const ExploreBackLink = ({
  href = ROUTES.EXPLORE.href,
  label = "Back to Explore",
}: {
  href?: string;
  label?: string;
}) => (
  <Link
    href={href}
    className="inline-flex items-center gap-2 text-sm font-medium text-secondary-700 transition-colors hover:text-primary-700"
  >
    <ArrowLeft className="size-4" aria-hidden />
    {label}
  </Link>
);

export default memo(ExploreBackLink);

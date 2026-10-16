import { cn } from "@/lib/utils";
import { BadgeCheck } from "lucide-react";
import React from "react";

/** Checked and approved by the Turnupz team. */
const VerifiedTick: React.FC<{ className?: string }> = ({ className }) => (
  <BadgeCheck
    role="img"
    aria-label="Verified"
    className={cn("inline size-4 shrink-0 text-primary-500", className)}
  >
    <title>Verified by Turnupz</title>
  </BadgeCheck>
);

export default VerifiedTick;

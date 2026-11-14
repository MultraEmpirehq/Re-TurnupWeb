import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CircleCheck,
  Info,
  OctagonAlert,
  type LucideIcon,
} from "lucide-react";
import React from "react";
import { TONE_CLASSES, type TTone } from "./status-badge";

const ICONS: Record<TTone, LucideIcon> = {
  success: CircleCheck,
  warning: AlertTriangle,
  danger: OctagonAlert,
  info: Info,
  neutral: Info,
};

/**
 * A message box on a page: a to-do, a warning, something that's blocked, or
 * a note. Tone sets the colour and the default icon; `action` sits on the right
 * (below on phones). The one callout across the site.
 */
const Notice = ({
  tone = "info",
  title,
  icon,
  action,
  className,
  children,
}: {
  tone?: TTone;
  title?: React.ReactNode;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) => {
  const Icon = icon ?? ICONS[tone];
  const look = TONE_CLASSES[tone];
  return (
    <div
      role={tone === "danger" || tone === "warning" ? "alert" : "status"}
      className={cn(
        "flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:p-5",
        look.soft,
        look.line,
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <Icon className={cn("mt-0.5 size-4 shrink-0", look.text)} aria-hidden />
        <div className="min-w-0 space-y-0.5 text-sm">
          {title && <p className="font-semibold text-foreground">{title}</p>}
          {children && (
            <div className="leading-6 text-foreground/75">{children}</div>
          )}
        </div>
      </div>
      {action && <div className="shrink-0 sm:ml-2">{action}</div>}
    </div>
  );
};

export default Notice;

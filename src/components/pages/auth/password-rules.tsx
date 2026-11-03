import { PASSWORD_RULES } from "@/lib/password";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import React, { memo } from "react";

/** The password rules, ticked off as they're met. */
const PasswordRules = ({ value }: { value: string }) => (
  <ul className="grid grid-cols-1 gap-1.5 text-xs sm:grid-cols-2" aria-label="Password rules">
    {PASSWORD_RULES.map((rule) => {
      const met = rule.test(value);
      return (
        <li
          key={rule.label}
          className={cn(
            "flex items-center gap-1.5 transition-colors",
            met ? "text-emerald-600" : "text-secondary-950/50",
          )}
        >
          <Check className={cn("size-3.5", met ? "opacity-100" : "opacity-30")} aria-hidden />
          {rule.label}
        </li>
      );
    })}
  </ul>
);

export default memo(PasswordRules);

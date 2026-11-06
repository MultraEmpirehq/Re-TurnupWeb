"use client";

import { Switch } from "@/components/ui/switch";
import React, { memo } from "react";

/** Registration: approve each person yourself, or let them straight in (the default). */
const RegistrationApprovalSwitch: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
}> = ({ checked, onChange }) => (
  <div className="flex w-full items-center justify-between gap-4 rounded-2xl border border-secondary-100 p-4">
    <div>
      <p className="text-sm font-semibold text-secondary-900">Approve registrations</p>
      <p className="text-sm text-secondary-500">
        {checked
          ? "You approve each person before they get their place."
          : "People get their place as soon as they register."}
      </p>
    </div>
    <Switch checked={checked} onCheckedChange={onChange} aria-label="Approve registrations" />
  </div>
);

export default memo(RegistrationApprovalSwitch);

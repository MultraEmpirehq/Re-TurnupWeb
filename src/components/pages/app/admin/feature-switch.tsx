"use client";

import { constructErrorMessage } from "@/api/functions";
import { Switch } from "@/components/ui/switch";
import { TFeatures, useAdminFeatures, useSetFeature } from "@/hooks/use-features";
import React, { memo } from "react";
import { toast } from "sonner";

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

/** One platform-wide switch, saying what on and off mean; changes are audited. */
const FeatureSwitch: React.FC<{
  feature: keyof TFeatures;
  label: string;
  onText: string;
  offText: string;
}> = ({ feature, label, onText, offText }) => {
  const { data: features = [], isLoading } = useAdminFeatures();
  const setFeature = useSetFeature();
  const current = features.find((item) => item.feature === feature);
  const enabled = current?.enabled ?? false;
  const id = `feature-${feature}`;

  const toggle = (next: boolean) =>
    setFeature.mutate(
      { feature, enabled: next },
      {
        onSuccess: () => toast.success(`${label}: ${next ? "on" : "off"}`),
        onError: (error) =>
          toast.error(
            constructErrorMessage(error as TApiErrorResponseType, `Couldn't change ${label}.`),
          ),
      },
    );

  return (
    <section className="flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-5">
      <div className="min-w-0 space-y-1">
        <label htmlFor={id} className="font-semibold">
          {label}
        </label>
        <p className="text-sm text-muted-foreground">{enabled ? onText : offText}</p>
        {current?.updatedAt && (
          <p className="text-xs text-muted-foreground">Last changed {when(current.updatedAt)}</p>
        )}
      </div>
      <Switch
        id={id}
        checked={enabled}
        disabled={isLoading || setFeature.isPending}
        onCheckedChange={toggle}
        aria-label={label}
      />
    </section>
  );
};

export default memo(FeatureSwitch);

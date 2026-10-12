"use client";

import { getData } from "@/api";
import { Button } from "@/components/ui/button";
import useUserStore, { EUserRoles } from "@/stores/user-store";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import {
  STATUS_LABELS,
  STORAGE_KEY,
  VendorVerificationApiResponse,
  VerificationStatus,
  VerificationStepKey,
} from "./types";

type TSnapshot = {
  status: VerificationStatus;
  stepStatuses: Partial<Record<VerificationStepKey, VerificationStatus>>;
};

const EMPTY: TSnapshot = { status: "not_started", stepStatuses: {} };

/** The last status seen, so banners show instantly before the API answers. */
export const readSnapshot = (): TSnapshot => {
  if (typeof window === "undefined") return EMPTY;
  try {
    const saved = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? "null",
    );
    return saved?.status
      ? { status: saved.status, stepStatuses: saved.stepStatuses ?? {} }
      : EMPTY;
  } catch {
    return EMPTY;
  }
};

export const writeSnapshot = (data?: VendorVerificationApiResponse | null) => {
  if (!data?.status) return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        status: data.status,
        stepStatuses: data.stepStatuses ?? {},
      }),
    );
  } catch {
    // Storage can be full or blocked; the API stays the source of truth.
  }
};

export const useVendorVerificationSnapshot = () => {
  const [snapshot, setSnapshot] = useState<TSnapshot>(EMPTY);
  useEffect(() => setSnapshot(readSnapshot()), []);
  return snapshot;
};

const TONES: Record<VerificationStatus, string> = {
  approved: "bg-emerald-50 text-emerald-700",
  submitted: "bg-primary-50 text-primary-700",
  rejected: "bg-red-50 text-red-600",
  needs_more_info: "bg-secondary-50 text-secondary-700",
  in_progress: "bg-secondary-50 text-secondary-600",
  not_started: "bg-secondary-50 text-secondary-600",
};

export const VendorVerificationStatusBadge: React.FC<{
  status?: VerificationStatus;
  prefix?: boolean;
}> = ({ status = "not_started", prefix = true }) => (
  <span
    className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold tracking-[0.12em] uppercase ${TONES[status]}`}
  >
    {prefix ? "Verification: " : ""}
    {STATUS_LABELS[status]}
  </span>
);

/** Shown on vendor pages until they're approved, linking to the form. */
export const VendorVerificationNotice: React.FC<{
  context?: "dashboard" | "create" | "wallet";
}> = ({ context = "dashboard" }) => {
  const [{ status }, setSnapshot] = useState<TSnapshot>(EMPTY);
  // Admins aren't vendors, so there's nothing for them to verify.
  const isAdmin = useUserStore(
    (state) => state.userDetails?.role === EUserRoles.ADMIN,
  );

  useEffect(() => {
    if (isAdmin) return;
    setSnapshot(readSnapshot());
    getData<VendorVerificationApiResponse>("/vendor/verification")
      .then(({ data }) => {
        if (!data.data?.status) return;
        writeSnapshot(data.data);
        setSnapshot({
          status: data.data.status,
          stepStatuses: data.data.stepStatuses ?? {},
        });
      })
      .catch(() => undefined);
  }, [isAdmin]);

  if (isAdmin || status === "approved") return null;

  const copy =
    status === "submitted"
      ? "Your application is with our team. You'll hear back once it's reviewed."
      : status === "needs_more_info"
        ? "We need a little more from you before we can approve your account."
        : context === "wallet"
          ? "Verify your vendor account to be paid for ticket sales."
          : context === "create"
            ? "You can keep building this draft, but paid publishing unlocks once you're verified."
            : "Complete vendor verification to publish paid events and be paid.";

  return (
    <section className="rounded-[1.5rem] border border-primary-100 bg-primary-50/70 p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="rounded-2xl bg-white p-3 text-primary-700">
            <ShieldCheck className="size-5" />
          </span>
          <div>
            <VendorVerificationStatusBadge status={status} />
            <h2 className="mt-3 text-lg font-bold text-secondary-950">
              {status === "submitted"
                ? "Verification under review"
                : "Vendor verification required"}
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-secondary-600">
              {copy}
            </p>
          </div>
        </div>
        {status !== "submitted" && (
          <Button
            asChild
            className="h-11 rounded-2xl bg-secondary-400 px-5 text-sm font-semibold text-white hover:bg-secondary-500"
          >
            <Link href="/app/settings/vendor-verification">
              {status === "not_started"
                ? "Start verification"
                : "Continue verification"}
            </Link>
          </Button>
        )}
      </div>
    </section>
  );
};

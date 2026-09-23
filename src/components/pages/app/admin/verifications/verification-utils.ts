import {
  IVendorVerification,
  IVerificationDocument,
  TApprovalLevel,
} from "@/lib/types";
import { format } from "date-fns";

export const APPROVAL_LEVELS: {
  value: TApprovalLevel;
  label: string;
  hint: string;
}[] = [
  {
    value: "basic_verified",
    label: "Basic",
    hint: "Free and registration-only events",
  },
  { value: "paid_verified", label: "Paid", hint: "May sell paid tickets" },
  {
    value: "cross_border_verified",
    label: "Cross-border",
    hint: "May sell across countries",
  },
  {
    value: "high_risk_review",
    label: "High risk",
    hint: "Blocked from publishing pending manual review",
  },
];

export const approvalLevelLabel = (level?: TApprovalLevel | null) =>
  APPROVAL_LEVELS.find((option) => option.value === level)?.label ?? null;

export const vendorName = (verification: IVendorVerification) => {
  const vendor = verification.vendor;
  const legal = [verification.legalFirstName, verification.legalLastName]
    .filter(Boolean)
    .join(" ");
  return vendor?.name?.trim() || legal || vendor?.username || "Unnamed vendor";
};

export const vendorTypeLabel = (type: IVendorVerification["vendorType"]) =>
  type === "business" ? "Business" : type === "individual" ? "Individual" : "—";

export const formatDate = (value?: string | null, withTime = false) =>
  value
    ? format(new Date(value), withTime ? "d MMM yyyy, HH:mm" : "d MMM yyyy")
    : "—";

export const isImageDocument = (document?: IVerificationDocument | null) =>
  !!document &&
  (document.type?.toUpperCase() === "IMAGE" ||
    /\.(png|jpe?g|webp|gif|avif)(\?|$)/i.test(document.url));

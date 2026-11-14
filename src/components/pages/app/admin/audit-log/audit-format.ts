import {
  ADMIN_PERMISSION_LABELS,
  TAdminPermission,
} from "@/hooks/use-admin-permissions";
import type { IAuditLogEntry, TAuditTargetType } from "@/hooks/use-admin-audit-logs";
import type { TTone } from "@/components/ui/status-badge";

// What each recorded action reads as, and the colour of its pill.
export const ACTIONS: Record<string, { label: string; tone: string }> = {
  "vendor_verification.reviewed": {
    label: "Reviewed verification",
    tone: "bg-info-soft text-info",
  },
  "vendor_verification.decision_undone": {
    label: "Undid a decision",
    tone: "bg-warning-soft text-warning",
  },
  "vendor_verification.payout_revealed": {
    label: "Viewed bank details",
    tone: "bg-primary-50 text-primary-700",
  },
  "event.deleted": { label: "Deleted event", tone: "bg-danger-soft text-danger" },
  "event.suspended": {
    label: "Suspended event",
    tone: "bg-secondary-50 text-secondary-800",
  },
  "event.restored": {
    label: "Restored event",
    tone: "bg-success-soft text-success",
  },
  "category.created": {
    label: "Created category",
    tone: "bg-success-soft text-success",
  },
  "category.updated": {
    label: "Edited category",
    tone: "bg-muted text-muted-foreground",
  },
  "category.deleted": {
    label: "Deleted category",
    tone: "bg-danger-soft text-danger",
  },
  "venue.created": {
    label: "Created venue",
    tone: "bg-success-soft text-success",
  },
  "venue.updated": {
    label: "Edited venue",
    tone: "bg-muted text-muted-foreground",
  },
  "venue.deleted": { label: "Deleted venue", tone: "bg-danger-soft text-danger" },
  "faq.created": { label: "Added FAQ", tone: "bg-success-soft text-success" },
  "faq.updated": {
    label: "Edited FAQ",
    tone: "bg-muted text-muted-foreground",
  },
  "faq.deleted": { label: "Deleted FAQ", tone: "bg-danger-soft text-danger" },
  "admin.added": {
    label: "Added admin",
    tone: "bg-success-soft text-success",
  },
  "admin.permissions_changed": {
    label: "Changed permissions",
    tone: "bg-info-soft text-info",
  },
  "admin.suspended": {
    label: "Suspended admin",
    tone: "bg-secondary-50 text-secondary-800",
  },
  "admin.reactivated": {
    label: "Reactivated admin",
    tone: "bg-success-soft text-success",
  },
  "admin.removed": { label: "Removed admin", tone: "bg-danger-soft text-danger" },
  "user.suspended": {
    label: "Suspended user",
    tone: "bg-secondary-50 text-secondary-800",
  },
  "user.restricted": {
    label: "Restricted user",
    tone: "bg-warning-soft text-warning",
  },
  "user.unrestricted": {
    label: "Lifted restriction",
    tone: "bg-success-soft text-success",
  },
  "vendor_verification.id_expiry_set": {
    label: "Set ID expiry",
    tone: "bg-muted text-muted-foreground",
  },
  "vendor_verification.id_renewal_reviewed": {
    label: "Checked new ID",
    tone: "bg-info-soft text-info",
  },
  "user.reactivated": {
    label: "Reactivated user",
    tone: "bg-success-soft text-success",
  },
  "event.approved": {
    label: "Approved event",
    tone: "bg-success-soft text-success",
  },
  "event.rejected": {
    label: "Sent event back",
    tone: "bg-secondary-50 text-secondary-800",
  },
  "event_report.resolved": {
    label: "Resolved report",
    tone: "bg-success-soft text-success",
  },
  "event_report.dismissed": {
    label: "Dismissed report",
    tone: "bg-muted text-muted-foreground",
  },
  "contact_message.resolved": {
    label: "Resolved inquiry",
    tone: "bg-success-soft text-success",
  },
  "ticket_transfer.cancelled": {
    label: "Cancelled transfer",
    tone: "bg-danger-soft text-danger",
  },
};

export const permissionNames = (value: unknown) =>
  Array.isArray(value)
    ? value
        .map(
          (permission) =>
            ADMIN_PERMISSION_LABELS[permission as TAdminPermission] ??
            String(permission),
        )
        .join(", ")
    : "";

export const DECISIONS: Record<string, string> = {
  id_accepted: "Accepted the new ID",
  id_turned_down: "Turned down the new ID",
  approved: "Approved",
  rejected: "Rejected",
  needs_more_info: "Asked for more info",
};

export const text = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

/** The one or two facts worth reading at a glance; the rest stays in the record. */
export const summariseDetails = (entry: IAuditLogEntry) => {
  const details = entry.details ?? {};
  const parts: string[] = [];
  const undid = text(details.undid);
  if (undid) parts.push(`took back “${DECISIONS[undid] ?? undid}”`);
  if (details.undoneEntryId && !undid) parts.push("undone from the audit log");
  const decision = text(details.decision);
  if (decision) {
    parts.push(DECISIONS[decision] ?? decision);
    const level = text(details.approvalLevel);
    if (level) parts.push(`level: ${level.replace(/_/g, " ")}`);
    const step = text(details.step);
    if (step) parts.push(`step: ${step}`);
  }
  const reason = text(details.reason) ?? text(details.message);
  if (reason) parts.push(`“${reason}”`);
  const added = permissionNames(details.added);
  if (added) parts.push(`gave ${added}`);
  const removed = permissionNames(details.removed);
  if (removed) parts.push(`took ${removed}`);
  if (entry.action === "admin.added") {
    const granted = permissionNames(details.permissions);
    if (granted) parts.push(granted);
  }
  const newRole = text(details.newRole);
  if (newRole) parts.push(`now a ${newRole}`);
  if (Array.isArray(details.fields) && details.fields.length) {
    parts.push(`changed ${details.fields.join(", ")}`);
  }
  return parts.join(" · ") || "—";
};


/** The pill tone for an action (its colour class names the tone). */
export const actionTone = (action: string): TTone => {
  const tone = ACTIONS[action]?.tone ?? "";
  return (["success", "warning", "danger", "info"] as const).find((name) => tone.includes(name)) ?? "neutral";
};

export const actionLabel = (action: string) =>
  ACTIONS[action]?.label ??
  action.replace(/[._]/g, " ").replace(/^\w/, (letter) => letter.toUpperCase());

export const TARGET_LABELS: Record<TAuditTargetType, string> = {
  vendor_verification: "Organiser application",
  event: "Event",
  category: "Category",
  venue: "Venue",
  faq: "FAQ",
  admin: "Admin",
  user: "Account",
  event_report: "Event report",
  contact_message: "Inquiry",
  ticket_transfer: "Ticket transfer",
};

/** Where an admin can open the record itself, when there's a page for it. */
export const targetHref = (entry: IAuditLogEntry) => {
  if (!entry.targetId) return null;
  switch (entry.targetType) {
    case "vendor_verification":
      return `/app/admin/verifications/${entry.targetId}`;
    case "event":
      return `/app/admin/events/${entry.targetId}`;
    default:
      return null;
  }
};

/** A recorded field's name in words: organiserId → Organiser, approvalLevel → Approval level. */
const KEY_NAMES: Record<string, string> = {
  organiserId: "Organiser (id)",
  preparedByAdminId: "Set up by admin (id)",
  hostId: "Host (id)",
  undoneEntryId: "Undoes entry",
  undid: "Took back",
  wasOn: "Was on",
  automatic: "Done automatically",
  previous: "Before",
  previousCheckIn: "Previous check-in",
  previousScanner: "Previous scanner",
};
export const keyName = (key: string) =>
  KEY_NAMES[key] ??
  key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .toLowerCase()
    .replace(/^\w/, (letter) => letter.toUpperCase());

const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

/** One recorded value as words: dates, yes/no, permission names, decisions. */
export const valueText = (key: string, value: unknown): string => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) {
    if (["permissions", "added", "removed"].includes(key)) return permissionNames(value) || "—";
    return value.map((item) => valueText(key, item)).join(", ");
  }
  if (typeof value === "string") {
    if (ISO.test(value)) return new Date(value).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
    if (key === "decision" || key === "undid") return DECISIONS[value] ?? value;
    return value.replace(/_/g, key === "approvalLevel" || key === "status" ? " " : "_");
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

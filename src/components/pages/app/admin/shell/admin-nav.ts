import { TAdminPermission } from "@/hooks/use-admin-permissions";
import { TAdminPendingKey } from "@/hooks/use-admin-dashboard";
import { ROUTES } from "@/lib/variables";
import {
  ArrowLeftRight,
  ListChecks,
  MessagesSquare,
  BadgeCheck,
  Banknote,
  CalendarDays,
  CalendarPlus,
  CircleDollarSign,
  Gift,
  Undo2,
  ClipboardCheck,
  Flag,
  FileChartColumn,
  Headset,
  Inbox,
  LayoutDashboard,
  LifeBuoy,
  Logs,
  LucideIcon,
  Mail,
  MapPin,
  Mic,
  Megaphone,
  MessageSquareText,
  Newspaper,
  Plug,
  Receipt,
  ScanLine,
  ScrollText,
  Sparkles,
  Settings,
  SlidersHorizontal,
  Tags,
  Ticket,
  UserCog,
  Users,
} from "lucide-react";

export type TAdminNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Other routes that belong to this section, such as its create form. */
  alsoActiveOn?: string[];
  /** Hidden from admins who don't hold it, since the page would refuse them. */
  permission?: TAdminPermission;
    /** Badged with how much is waiting in this queue (see useAdminPendingCounts). */
  pendingKey?: TAdminPendingKey;
  /**
   * Not built yet. The link opens the shared "coming soon" page, which shows this
   * text as what the section will do.
   */
  comingSoon?: string;
};

export type TAdminNavGroup = {
  label: string;
  items: TAdminNavItem[];
  /** Departments get their own icon and colour and can be collapsed. */
  department?: {
    icon: LucideIcon;
    /** Tailwind classes for the department's icon tile. */
    accentClassName: string;
    description: string;
  };
};

const ADMIN_BASE = ROUTES.ADMIN_OVERVIEW.href;

export const ADMIN_NAV_GROUPS: TAdminNavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        label: ROUTES.ADMIN_OVERVIEW.label,
        href: ROUTES.ADMIN_OVERVIEW.href,
        icon: LayoutDashboard,
      },
      // Covers every department, so it sits beside Overview rather than in one.
      {
        label: "Audit Log",
        href: `${ADMIN_BASE}/audit-log`,
        icon: ScrollText,
        permission: "AUDIT_VIEW",
      },
    ],
  },
  {
    label: "Marketing",
    department: {
      icon: Megaphone,
      accentClassName: "bg-primary-50 text-primary-600",
      description: "Handles campaigns, content and growth.",
    },
    items: [
      {
        label: "Waitlist",
        href: `${ADMIN_BASE}/marketing/waitlist`,
        icon: ListChecks,
        permission: "MARKETING_MANAGE",
      },
      {
        label: "Referrals",
        href: `${ADMIN_BASE}/marketing/referrals`,
        icon: Gift,
        permission: "MARKETING_MANAGE",
      },
      {
        label: "Influencer Codes",
        href: `${ADMIN_BASE}/marketing/influencer-codes`,
        icon: Sparkles,
        permission: "MARKETING_MANAGE",
      },
      {
        label: "Campaigns",
        href: `${ADMIN_BASE}/marketing/campaigns`,
        icon: Megaphone,
        permission: "MARKETING_MANAGE",
        comingSoon: "Plan, run and measure marketing campaigns.",
      },
      {
        label: "Content",
        href: `${ADMIN_BASE}/marketing/content`,
        icon: Newspaper,
        permission: "MARKETING_MANAGE",
        comingSoon: "Manage the content shown across the platform.",
      },
      {
        label: "Newsletters",
        href: `${ADMIN_BASE}/marketing/newsletters`,
        icon: Mail,
        permission: "MARKETING_MANAGE",
        comingSoon: "Write and send newsletters to subscribers.",
      },
    ],
  },
  {
    label: "Events",
    department: {
      icon: CalendarDays,
      accentClassName: "bg-sky-50 text-sky-600",
      description: "Creates and manages events, bookings and event details.",
    },
    items: [
      {
        label: ROUTES.CREATE_EVENT.label,
        href: `${ADMIN_BASE}/events/create`,
        icon: CalendarPlus,
        permission: "EVENTS_MODERATE",
      },
      {
        label: "Manage Events",
        href: `${ADMIN_BASE}/events`,
        icon: CalendarDays,
        permission: "EVENTS_MODERATE",
      },
      {
        label: "Scan Tickets",
        href: `${ADMIN_BASE}/events/scan`,
        icon: ScanLine,
        permission: "TICKETS_SCAN",
      },
      {
        label: ROUTES.VENUES.label,
        href: `${ADMIN_BASE}/venues`,
        icon: MapPin,
        permission: "CATALOGUE_MANAGE",
      },
      {
        label: ROUTES.CATEGORIES.label,
        href: `${ADMIN_BASE}/categories`,
        icon: Tags,
        permission: "CATALOGUE_MANAGE",
      },
      {
        label: ROUTES.PERFORMERS.label,
        href: `${ADMIN_BASE}/performers`,
        icon: Mic,
        permission: "CATALOGUE_MANAGE",
      },
      {
        label: ROUTES.ADMIN_VERIFICATIONS.label,
        href: ROUTES.ADMIN_VERIFICATIONS.href,
        icon: BadgeCheck,
        permission: "VENDORS_VERIFY",
        pendingKey: "verifications",
      },
      // Events go live without review; what organisers add to the shared
      // directory (venues typed in, performers) is what's reviewed.
      {
        label: "Venue & Performer Reviews",
        pendingKey: "catalogue",
        href: `${ADMIN_BASE}/events/catalogue`,
        icon: ClipboardCheck,
        permission: "CATALOGUE_MANAGE",
      },
      {
        label: "Reports",
        pendingKey: "reports",
        href: `${ADMIN_BASE}/events/reports`,
        icon: Flag,
        permission: "EVENTS_MODERATE",
      },
    ],
  },
  {
    label: "Support",
    department: {
      icon: Headset,
      accentClassName: "bg-emerald-50 text-emerald-600",
      description: "Manages users, tickets and customer support.",
    },
    items: [
      {
        label: "Support Tickets",
        href: `${ADMIN_BASE}/support/tickets`,
        icon: Ticket,
        permission: "SUPPORT_MANAGE",
        comingSoon: "Track and respond to support tickets from users.",
      },
      {
        label: "Support chats",
        pendingKey: "supportChats",
        href: `${ADMIN_BASE}/support/chats`,
        icon: MessagesSquare,
        permission: "SUPPORT_MANAGE",
      },
      {
        label: "Inquiries",
        pendingKey: "inquiries",
        href: `${ADMIN_BASE}/support/inquiries`,
        icon: Inbox,
        permission: "SUPPORT_MANAGE",
      },
      {
        label: "Help Centre",
        href: `${ADMIN_BASE}/support/help-centre`,
        icon: LifeBuoy,
        permission: "SUPPORT_MANAGE",
        comingSoon: "Manage the help centre articles and FAQs.",
      },
      {
        label: "User Feedback",
        href: `${ADMIN_BASE}/support/feedback`,
        icon: MessageSquareText,
        permission: "SUPPORT_MANAGE",
        comingSoon: "Feedback and ratings left by users.",
      },
    ],
  },
  {
    label: "Finance",
    department: {
      icon: CircleDollarSign,
      accentClassName: "bg-secondary-50 text-secondary-600",
      description: "Handles payments, payouts and financial records.",
    },
    items: [
      {
        label: "Refunds",
        pendingKey: "refunds",
        href: `${ADMIN_BASE}/finance/refunds`,
        icon: Undo2,
        permission: "REFUNDS_MANAGE",
      },
      {
        label: "Transactions",
        href: `${ADMIN_BASE}/finance/transactions`,
        icon: ArrowLeftRight,
        permission: "FINANCE_VIEW",
        comingSoon: "Every payment made on the platform.",
      },
      {
        label: "Payouts",
        href: `${ADMIN_BASE}/finance/payouts`,
        icon: Banknote,
        permission: "FINANCE_VIEW",
        comingSoon: "Review and manage vendor payouts.",
      },
      {
        label: "Invoices",
        href: `${ADMIN_BASE}/finance/invoices`,
        icon: Receipt,
        permission: "FINANCE_VIEW",
        comingSoon: "Create and track invoices.",
      },
      {
        label: "Financial Reports",
        href: `${ADMIN_BASE}/finance/reports`,
        icon: FileChartColumn,
        permission: "FINANCE_VIEW",
        comingSoon: "Revenue, fees and financial analytics.",
      },
    ],
  },
  {
    label: "Operations",
    department: {
      icon: Settings,
      accentClassName: "bg-primary-50 text-primary-600",
      description: "Manages system operations, users and integrations.",
    },
    items: [
      {
        label: ROUTES.ADMIN_USERS.label,
        href: ROUTES.ADMIN_USERS.href,
        icon: Users,
        permission: "USERS_VIEW",
      },
      // Access is permission-based: any admin holding the admin-management
      // permission manages the others here. There is no separate super admin role.
      {
        label: "Admins & Permissions",
        href: `${ADMIN_BASE}/operations/admins`,
        icon: UserCog,
        permission: "ADMINS_MANAGE",
      },
      {
        label: "System Settings",
        href: `${ADMIN_BASE}/operations/settings`,
        icon: SlidersHorizontal,
        permission: "ADMINS_MANAGE",
        comingSoon: "Platform-wide settings and configuration.",
      },
      {
        label: "System Logs",
        href: `${ADMIN_BASE}/operations/logs`,
        icon: Logs,
        permission: "ADMINS_MANAGE",
        comingSoon: "Application and system logs.",
      },
      {
        label: "Integrations",
        href: `${ADMIN_BASE}/operations/integrations`,
        icon: Plug,
        permission: "ADMINS_MANAGE",
        comingSoon: "Connect and configure third-party services.",
      },
    ],
  },
];

const ADMIN_NAV_ITEMS = ADMIN_NAV_GROUPS.flatMap((group) => group.items);

/** The nav as one admin sees it: items they can't use go, then any group left empty. */
export const visibleAdminNavGroups = (
  has: (permission?: TAdminPermission) => boolean,
) =>
  ADMIN_NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => has(item.permission)),
  })).filter((group) => group.items.length > 0);

/** The permission the admin page at `pathname` needs, if it needs one. */
export const adminPermissionFor = (pathname: string) =>
  ADMIN_NAV_ITEMS.find(
    (item) =>
      item.permission &&
      item.href !== ROUTES.ADMIN_OVERVIEW.href &&
      isAdminNavItemActive(pathname, item),
  )?.permission;

/** How closely an item's routes match `pathname` (longest wins), or -1. */
const matchLength = (pathname: string, item: TAdminNavItem) =>
  Math.max(
    -1,
    ...[item.href, ...(item.alsoActiveOn ?? [])]
      .filter((href) => isWithin(pathname, href))
      .map((href) => href.length),
  );

const isWithin = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

/**
 * Overview is the parent of every other admin route, so it only counts as active on
 * its own page; everything else is active for itself and anything nested under it.
 */
export const isAdminNavItemActive = (pathname: string, item: TAdminNavItem) => {
  if (item.href === ROUTES.ADMIN_OVERVIEW.href) {
    return pathname === item.href;
  }
  // Only the closest match: on /events/reports, "Reports" is active, not
  // "Manage Events" too.
  const mine = matchLength(pathname, item);
  if (mine < 0) return false;
  return !ADMIN_NAV_ITEMS.some(
    (other) =>
      other !== item &&
      other.href !== ROUTES.ADMIN_OVERVIEW.href &&
      matchLength(pathname, other) > mine,
  );
};

export const adminSectionLabel = (pathname: string) =>
  ADMIN_NAV_ITEMS.find((item) => isAdminNavItemActive(pathname, item))?.label ??
  "Admin";

/** The section that hasn't been built yet at exactly this path, if there is one. */
export const findComingSoonSection = (pathname: string) => {
  for (const group of ADMIN_NAV_GROUPS) {
    const item = group.items.find(
      (candidate) => candidate.comingSoon && candidate.href === pathname,
    );
    if (item) return { group, item };
  }
  return undefined;
};

import { TAdminPermission } from "@/hooks/use-admin-permissions";
import { TAdminPendingKey } from "@/hooks/use-admin-dashboard";
import { ROUTES } from "@/lib/variables";
import {
  BadgeCheck,
  CalendarDays,
  CalendarPlus,
  CalendarRange,
  ChartColumn,
  CircleDollarSign,
  ClipboardCheck,
  Coins,
  Compass,
  Flag,
  Gift,
  Headset,
  Inbox,
  Landmark,
  LayoutDashboard,
  Library,
  ListChecks,
  ListFilter,
  LucideIcon,
  Mail,
  MapPin,
  Megaphone,
  MessagesSquare,
  Mic,
  Newspaper,
  Percent,
  ReceiptText,
  Rocket,
  ScanLine,
  ScrollText,
  Settings,
  ShieldCheck,
  Sparkles,
  Tags,
  TrendingUp,
  Undo2,
  UserCog,
  Users,
  UsersRound,
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
    ],
  },
  {
    label: "Events",
    department: {
      icon: CalendarDays,
      accentClassName: "bg-sky-50 text-sky-600",
      description: "Events, approvals and check-in.",
    },
    items: [
      {
        label: "All Events",
        href: `${ADMIN_BASE}/events`,
        icon: CalendarDays,
        permission: "EVENTS_MODERATE",
      },
      {
        label: ROUTES.CREATE_EVENT.label,
        href: `${ADMIN_BASE}/events/create`,
        icon: CalendarPlus,
        permission: "EVENTS_MODERATE",
      },
      {
        label: "Event Approvals",
        pendingKey: "eventReviews",
        href: `${ADMIN_BASE}/events/reviews`,
        icon: ClipboardCheck,
        permission: "EVENTS_MODERATE",
      },
      {
        label: "Check-in",
        href: `${ADMIN_BASE}/events/scan`,
        icon: ScanLine,
        permission: "TICKETS_SCAN",
      },
    ],
  },
  {
    label: "Catalogue",
    department: {
      icon: Library,
      accentClassName: "bg-violet-50 text-violet-600",
      description: "The venues, categories and performers organisers choose from.",
    },
    items: [
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
      // What organisers type in themselves (venues, categories, performers)
      // waits here before it joins the shared catalogue.
      {
        label: "Submissions",
        pendingKey: "catalogue",
        href: `${ADMIN_BASE}/events/catalogue`,
        icon: Inbox,
        permission: "CATALOGUE_MANAGE",
      },
    ],
  },
  {
    label: "Trust & Safety",
    department: {
      icon: ShieldCheck,
      accentClassName: "bg-amber-50 text-amber-600",
      description: "Verifies organisers and deals with reported events.",
    },
    items: [
      {
        label: "Organiser Verification",
        href: ROUTES.ADMIN_VERIFICATIONS.href,
        icon: BadgeCheck,
        permission: "VENDORS_VERIFY",
        pendingKey: "verifications",
      },
      {
        label: "Reported Events",
        pendingKey: "reports",
        href: `${ADMIN_BASE}/events/reports`,
        icon: Flag,
        permission: "EVENTS_MODERATE",
      },
    ],
  },
  {
    label: "Marketing",
    department: {
      icon: Megaphone,
      accentClassName: "bg-primary-50 text-primary-600",
      description: "Paid promotions, the waitlist, referrals, influencer codes and the company blog.",
    },
    items: [
      {
        label: "Promotions",
        pendingKey: "boosts",
        href: `${ADMIN_BASE}/events/boosts`,
        icon: Rocket,
        permission: "EVENTS_MODERATE",
      },
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
        label: "Company Blog",
        href: `${ADMIN_BASE}/marketing/news`,
        icon: Newspaper,
        permission: "MARKETING_MANAGE",
      },
    ],
  },
  {
    label: "Support",
    department: {
      icon: Headset,
      accentClassName: "bg-emerald-50 text-emerald-600",
      description: "Helps attendees and organisers.",
    },
    items: [
      {
        label: "Live Chats",
        pendingKey: "supportChats",
        href: `${ADMIN_BASE}/support/chats`,
        icon: MessagesSquare,
        permission: "SUPPORT_MANAGE",
      },
      {
        label: "Contact Messages",
        pendingKey: "inquiries",
        href: `${ADMIN_BASE}/support/inquiries`,
        icon: Mail,
        permission: "SUPPORT_MANAGE",
      },
    ],
  },
  {
    label: "Finance",
    department: {
      icon: CircleDollarSign,
      accentClassName: "bg-secondary-50 text-secondary-600",
      description: "Revenue, payments, organiser payouts, credit and refunds.",
    },
    items: [
      {
        label: "Revenue",
        href: `${ADMIN_BASE}/finance/revenue`,
        icon: TrendingUp,
        permission: "FINANCE_VIEW",
      },
      {
        label: "Transactions",
        href: `${ADMIN_BASE}/finance/transactions`,
        icon: ReceiptText,
        permission: "FINANCE_VIEW",
      },
      {
        label: "Organisers & payouts",
        href: `${ADMIN_BASE}/finance/organisers`,
        icon: Landmark,
        permission: "FINANCE_VIEW",
      },
      {
        label: "Credit",
        href: `${ADMIN_BASE}/finance/credit`,
        icon: Coins,
        permission: "FINANCE_VIEW",
      },
      {
        label: "Tax",
        href: `${ADMIN_BASE}/finance/tax`,
        icon: Percent,
        permission: "FINANCE_MANAGE",
      },
      {
        label: "Refunds",
        pendingKey: "refunds",
        href: `${ADMIN_BASE}/finance/refunds`,
        icon: Undo2,
        permission: "REFUNDS_MANAGE",
      },
    ],
  },
  {
    label: "Analytics",
    department: {
      icon: ChartColumn,
      accentClassName: "bg-primary-50 text-primary-600",
      description: "Audience, the sales funnel, how events did and where buyers come from.",
    },
    items: [
      {
        label: "Audience",
        href: `${ADMIN_BASE}/analytics/audience`,
        icon: UsersRound,
        permission: "ANALYTICS_VIEW",
      },
      {
        label: "Sales funnel",
        href: `${ADMIN_BASE}/analytics/funnel`,
        icon: ListFilter,
        permission: "ANALYTICS_VIEW",
      },
      {
        label: "Events",
        href: `${ADMIN_BASE}/analytics/events`,
        icon: CalendarRange,
        permission: "ANALYTICS_VIEW",
      },
      {
        label: "Buyer sources",
        href: `${ADMIN_BASE}/analytics/sources`,
        icon: Compass,
        permission: "ANALYTICS_VIEW",
      },
    ],
  },
  {
    label: "Administration",
    department: {
      icon: Settings,
      accentClassName: "bg-slate-100 text-slate-600",
      description: "Accounts, admin access and the audit log.",
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
      // Every admin action across all departments.
      {
        label: "Audit Log",
        href: `${ADMIN_BASE}/audit-log`,
        icon: ScrollText,
        permission: "AUDIT_VIEW",
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

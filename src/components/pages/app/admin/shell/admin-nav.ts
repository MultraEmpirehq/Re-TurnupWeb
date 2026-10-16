import { TAdminPermission } from "@/hooks/use-admin-permissions";
import { ROUTES } from "@/lib/variables";
import {
  ArrowLeftRight,
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
  /** Shows the count of applications waiting for a decision. */
  showsPendingVerifications?: boolean;
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
        label: "Referrals",
        href: `${ADMIN_BASE}/marketing/referrals`,
        icon: Gift,
        permission: "USERS_VIEW",
      },
      {
        label: "Influencer Codes",
        href: `${ADMIN_BASE}/marketing/influencer-codes`,
        icon: Sparkles,
        permission: "USERS_VIEW",
      },
      {
        label: "Campaigns",
        href: `${ADMIN_BASE}/marketing/campaigns`,
        icon: Megaphone,
        comingSoon: "Plan, run and measure marketing campaigns.",
      },
      {
        label: "Content",
        href: `${ADMIN_BASE}/marketing/content`,
        icon: Newspaper,
        comingSoon: "Manage the content shown across the platform.",
      },
      {
        label: "Newsletters",
        href: `${ADMIN_BASE}/marketing/newsletters`,
        icon: Mail,
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
        href: ROUTES.CREATE_EVENT.href,
        icon: CalendarPlus,
      },
      {
        label: "Manage Events",
        href: ROUTES.EVENTS.href,
        icon: CalendarDays,
      },
      {
        label: ROUTES.VENUES.label,
        href: ROUTES.VENUES.href,
        icon: MapPin,
        alsoActiveOn: [ROUTES.CREATE_VENUE.href],
        permission: "CATALOGUE_MANAGE",
      },
      {
        label: ROUTES.CATEGORIES.label,
        href: ROUTES.CATEGORIES.href,
        icon: Tags,
        alsoActiveOn: [ROUTES.CREATE_CATEGORY.href],
        permission: "CATALOGUE_MANAGE",
      },
      {
        label: ROUTES.PERFORMERS.label,
        href: ROUTES.PERFORMERS.href,
        icon: Mic,
        permission: "CATALOGUE_MANAGE",
      },
      {
        label: ROUTES.ADMIN_VERIFICATIONS.label,
        href: ROUTES.ADMIN_VERIFICATIONS.href,
        icon: BadgeCheck,
        permission: "VENDORS_VERIFY",
        showsPendingVerifications: true,
      },
      // Events go live without review; what organisers add to the shared
      // directory (venues typed in, performers) is what's reviewed.
      {
        label: "Venue & Performer Reviews",
        href: `${ADMIN_BASE}/events/catalogue`,
        icon: ClipboardCheck,
        permission: "CATALOGUE_MANAGE",
      },
      {
        label: "Reports",
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
        comingSoon: "Track and respond to support tickets from users.",
      },
      {
        label: "Inquiries",
        href: `${ADMIN_BASE}/support/inquiries`,
        icon: Inbox,
        permission: "SUPPORT_MANAGE",
      },
      {
        label: "Help Centre",
        href: `${ADMIN_BASE}/support/help-centre`,
        icon: LifeBuoy,
        comingSoon: "Manage the help centre articles and FAQs.",
      },
      {
        label: "User Feedback",
        href: `${ADMIN_BASE}/support/feedback`,
        icon: MessageSquareText,
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
        href: `${ADMIN_BASE}/finance/refunds`,
        icon: Undo2,
        permission: "REFUNDS_MANAGE",
      },
      {
        label: "Transactions",
        href: `${ADMIN_BASE}/finance/transactions`,
        icon: ArrowLeftRight,
        comingSoon: "Every payment made on the platform.",
      },
      {
        label: "Payouts",
        href: `${ADMIN_BASE}/finance/payouts`,
        icon: Banknote,
        comingSoon: "Review and manage vendor payouts.",
      },
      {
        label: "Invoices",
        href: `${ADMIN_BASE}/finance/invoices`,
        icon: Receipt,
        comingSoon: "Create and track invoices.",
      },
      {
        label: "Financial Reports",
        href: `${ADMIN_BASE}/finance/reports`,
        icon: FileChartColumn,
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
        comingSoon: "Platform-wide settings and configuration.",
      },
      {
        label: "System Logs",
        href: `${ADMIN_BASE}/operations/logs`,
        icon: Logs,
        comingSoon: "Application and system logs.",
      },
      {
        label: "Integrations",
        href: `${ADMIN_BASE}/operations/integrations`,
        icon: Plug,
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
  return [item.href, ...(item.alsoActiveOn ?? [])].some((href) =>
    isWithin(pathname, href),
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

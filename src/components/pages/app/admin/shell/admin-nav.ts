import { ROUTES } from "@/lib/variables";
import {
  ArrowLeftRight,
  BadgeCheck,
  Banknote,
  CalendarDays,
  CalendarPlus,
  ChartNoAxesCombined,
  CircleDollarSign,
  FileChartColumn,
  Headset,
  Inbox,
  LayoutDashboard,
  LifeBuoy,
  Logs,
  LucideIcon,
  Mail,
  MapPin,
  Megaphone,
  MessageSquareText,
  Newspaper,
  Plug,
  Receipt,
  ScrollText,
  Settings,
  ShieldUser,
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
      {
        label: "Performance Overview",
        href: ROUTES.DASHBOARD.href,
        icon: ChartNoAxesCombined,
      },
    ],
  },
  {
    label: "Super Admin",
    department: {
      icon: ShieldUser,
      accentClassName: "bg-violet-50 text-violet-600",
      description: "Manage other Super Admins and platform access.",
    },
    items: [
      {
        label: "Super Admins",
        href: `${ADMIN_BASE}/super-admins`,
        icon: UserCog,
        comingSoon:
          "Invite, approve, suspend and remove Super Admins, and assign or revoke their permissions.",
      },
      {
        label: "Audit Log",
        href: `${ADMIN_BASE}/audit-log`,
        icon: ScrollText,
        comingSoon:
          "Every sensitive action, including who created, invited, removed, suspended or changed permissions for a Super Admin.",
      },
    ],
  },
  {
    label: "Marketing",
    department: {
      icon: Megaphone,
      accentClassName: "bg-pink-50 text-pink-600",
      description: "Handles campaigns, content and growth.",
    },
    items: [
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
      },
      {
        label: ROUTES.CATEGORIES.label,
        href: ROUTES.CATEGORIES.href,
        icon: Tags,
        alsoActiveOn: [ROUTES.CREATE_CATEGORY.href],
      },
      {
        label: ROUTES.ADMIN_VERIFICATIONS.label,
        href: ROUTES.ADMIN_VERIFICATIONS.href,
        icon: BadgeCheck,
        showsPendingVerifications: true,
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
        comingSoon: "Messages sent through the contact form.",
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
      accentClassName: "bg-amber-50 text-amber-600",
      description: "Handles payments, payouts and financial records.",
    },
    items: [
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
      accentClassName: "bg-teal-50 text-teal-600",
      description: "Manages system operations, users and integrations.",
    },
    items: [
      {
        label: ROUTES.ADMIN_USERS.label,
        href: ROUTES.ADMIN_USERS.href,
        icon: Users,
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

const isWithin = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);

/**
 * Overview and the performance dashboard are parents of every other admin route, so
 * they only count as active on their own page; everything else is active for itself
 * and anything nested under it.
 */
export const isAdminNavItemActive = (pathname: string, item: TAdminNavItem) => {
  if (
    item.href === ROUTES.ADMIN_OVERVIEW.href ||
    item.href === ROUTES.DASHBOARD.href
  ) {
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
